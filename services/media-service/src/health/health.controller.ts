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

/*
 * VERSION_NEUTRAL es obligatorio aqui.
 *
 * Con el versionado por URI activado y una version por defecto, Nest le pone
 * el prefijo /v1 a TODOS los controladores, incluidos los que estan excluidos
 * del prefijo global /api. El resultado seria /v1/health, y los healthcheck de
 * los Dockerfile y del compose (que llaman a /health) empezarian a devolver
 * 404 sin que nadie se entere hasta que un contenedor se reinicia en bucle.
 */
@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly cache: CacheService,
    private readonly content: ContentClientService,
  ) {}

  /** Contrato compartido por los cinco servicios desde la Fase 1. No cambia. */
  @Get()
  @ApiOperation({ summary: 'El proceso responde' })
  check(): HealthResponse {
    return { status: 'ok', service: 'media-service' };
  }

  /**
   * media-service SI depende de content-service para responder: sin el no
   * puede resolver una playlist. Por eso aqui "degraded" refleja el estado de
   * la dependencia aguas arriba, no solo el suyo propio.
   */
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
