// Endpoint /health del gateway.

import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@blackpink/types';
import { CacheService } from '@blackpink/service-core';
import { UpstreamService } from '../upstream/upstream.service';

export interface AggregateHealthResponse {
  status: 'ok' | 'degraded';
  service: 'api-gateway';
  cache: 'up' | 'down' | 'disabled';
  upstreams: {
    name: string;
    status: 'up' | 'down';
    latencyMs: number | null;
    circuit: 'closed' | 'open' | 'half-open';
  }[];
}

@ApiTags('health')
// Sin versión (/health y no /v1/health): es donde lo buscan los HEALTHCHECK de Docker.
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly upstream: UpstreamService,
    private readonly cache: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'El proceso responde' })
  check(): HealthResponse {
    return { status: 'ok', service: 'api-gateway' };
  }

  @Get('aggregate')
  @ApiOperation({ summary: 'Estado de la cache y de todos los servicios' })
  async aggregate(): Promise<AggregateHealthResponse> {
    const [cacheUp, content, media] = await Promise.all([
      this.cache.isReachable(),
      this.upstream.probe('content'),
      this.upstream.probe('media'),
    ]);

    const upstreams = [
      { name: 'content-service', probe: content, circuit: this.upstream.breakerState('content') },
      { name: 'media-service', probe: media, circuit: this.upstream.breakerState('media') },
    ].map((entry) => ({
      name: entry.name,
      status: entry.probe.up ? ('up' as const) : ('down' as const),
      latencyMs: entry.probe.latencyMs,
      circuit: entry.circuit.state,
    }));

    return {
      status: upstreams.every((entry) => entry.status === 'up') ? 'ok' : 'degraded',
      service: 'api-gateway',
      cache: process.env.REDIS_URL ? (cacheUp ? 'up' : 'down') : 'disabled',
      upstreams,
    };
  }
}
