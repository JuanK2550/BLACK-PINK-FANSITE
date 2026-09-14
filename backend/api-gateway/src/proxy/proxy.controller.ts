// Reenvía las peticiones GET a su servicio.

import { All, Controller, NotFoundException, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { REQUEST_ID_HEADER } from '../common/request-id.middleware';
import { UpstreamService } from '../upstream/upstream.service';
import { resolveRoute } from './routes';

@ApiExcludeController()
@Controller()
export class ProxyController {
  constructor(private readonly upstream: UpstreamService) {}

  @All('*path')
  @Throttle({ expensive: { limit: 20, ttl: 60_000 } })
  async forward(@Req() request: Request, @Res() response: Response): Promise<void> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      throw new NotFoundException(`No existe la ruta ${request.method} ${request.path}.`);
    }

    const publicPath = request.path.replace(/^\/api\/v1/, '');
    const route = resolveRoute(publicPath);

    if (!route) {
      throw new NotFoundException(`No existe la ruta ${request.path}.`);
    }

    const query = new URL(request.url, 'http://gateway').searchParams;
    // Parámetro de revisión interna: desde internet nunca llega a los servicios.
    query.delete('includeUnverified');
    const locale = query.get('locale') ?? undefined;

    const result = await this.upstream.get(
      route.rule.upstream,
      route.upstreamPath,
      query.toString(),
      route.rule.ttl,
      locale,
    );

    response.setHeader('x-gateway-cache', result.cached ? 'HIT' : 'MISS');
    response.setHeader('x-gateway-upstream', route.rule.upstream);

    if (result.stale) {
      response.setHeader('x-gateway-stale', 'true');
      response.setHeader('cache-control', 'no-store');
    }

    const requestId = request.headers[REQUEST_ID_HEADER];
    if (typeof requestId === 'string') {
      response.setHeader(REQUEST_ID_HEADER, requestId);
    }

    response.status(result.status).json(result.body);
  }
}
