// Endpoint /health del servicio de medios.

import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@blackpink/types';
import { CacheService } from '@blackpink/service-core';
import { ContentClientService } from '../content-client/content-client.service';

export interface DependencyHealthResponse {
  status: 'ok' | 'degraded';
  service: 'media-service';
  cache: 'up' | 'down' | 'disabled';
  contentService: 'up' | 'down';
}

@ApiTags('health')
// Sin versión (/health y no /v1/health): es donde lo buscan los HEALTHCHECK de Docker.
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly cache: CacheService,
    private readonly content: ContentClientService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'El proceso responde' })
  check(): HealthResponse {
    return { status: 'ok', service: 'media-service' };
  }

  @Get('dependencies')
  @ApiOperation({ summary: 'Estado de la cache y de content-service' })
  async checkDependencies(): Promise<DependencyHealthResponse> {
    const [cacheUp, contentUp] = await Promise.all([
      this.cache.isReachable(),
      this.content.isReachable(),
    ]);

    return {
      status: contentUp ? 'ok' : 'degraded',
      service: 'media-service',
      cache: process.env.REDIS_URL ? (cacheUp ? 'up' : 'down') : 'disabled',
      contentService: contentUp ? 'up' : 'down',
    };
  }
}
