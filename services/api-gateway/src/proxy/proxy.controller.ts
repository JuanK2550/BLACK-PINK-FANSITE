import { All, Controller, NotFoundException, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { REQUEST_ID_HEADER } from '../common/request-id.middleware';
import { UpstreamService } from '../upstream/upstream.service';
import { resolveRoute } from './routes';

/**
 * ============================================================================
 * REENVIO
 * ============================================================================
 * Un unico controlador atiende todo `/api/v1/content/*` y `/api/v1/media/*`.
 *
 * SOLO GET Y HEAD. Hoy la API es de lectura entera; aceptar escrituras
 * "por si acaso" seria abrir un camino sin autenticacion hacia los servicios
 * internos. Cuando haga falta escribir, se anade con su autenticacion.
 *
 * Queda FUERA de Swagger (`ApiExcludeController`): documentar aqui un comodin
 * no dice nada util. La documentacion unificada se compone de los esquemas
 * reales de cada servicio, en /docs.
 * ============================================================================
 */
/*
 * Sin `path`: el `/v1` lo pone el versionado global (VersioningType.URI con
 * defaultVersion '1'). Declararlo tambien aqui producia `/api/v1/v1/...`, y
 * ninguna peticion real llegaba al controlador.
 */
@ApiExcludeController()
@Controller()
export class ProxyController {
  constructor(private readonly upstream: UpstreamService) {}

  @All('*path')
  // El limite estricto se aplica a los endpoints marcados como costosos.
  // El general lo pone el guard global; este decorador solo lo endurece.
  @Throttle({ expensive: { limit: 20, ttl: 60_000 } })
  async forward(@Req() request: Request, @Res() response: Response): Promise<void> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      throw new NotFoundException(`No existe la ruta ${request.method} ${request.path}.`);
    }

    // `/api/v1/content/members` -> `/content/members`
    const publicPath = request.path.replace(/^\/api\/v1/, '');
    const route = resolveRoute(publicPath);

    if (!route) {
      throw new NotFoundException(`No existe la ruta ${request.path}.`);
    }

    const query = new URL(request.url, 'http://gateway').searchParams;
    const locale = query.get('locale') ?? undefined;

    const result = await this.upstream.get(
      route.rule.upstream,
      route.upstreamPath,
      query.toString(),
      route.rule.ttl,
      locale,
    );

    /*
     * Cabeceras de diagnostico. Sin ellas, "esta pagina muestra datos viejos"
     * es imposible de investigar: no se sabe si respondio la cache del
     * gateway, la del servicio o la copia de respaldo.
     */
    response.setHeader('x-gateway-cache', result.cached ? 'HIT' : 'MISS');
    response.setHeader('x-gateway-upstream', route.rule.upstream);

    if (result.stale) {
      // El servicio no responde y esto viene de la copia de seguridad.
      response.setHeader('x-gateway-stale', 'true');
      // Y se le dice al navegador que no lo guarde como si fuera fresco.
      response.setHeader('cache-control', 'no-store');
    }

    const requestId = request.headers[REQUEST_ID_HEADER];
    if (typeof requestId === 'string') {
      response.setHeader(REQUEST_ID_HEADER, requestId);
    }

    response.status(result.status).json(result.body);
  }
}
