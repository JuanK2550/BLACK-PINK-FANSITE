// Endpoint /health con comprobación de la base de datos.

import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@blackpink/types';
import { CacheService } from '@blackpink/service-core';
import { PrismaService } from '../prisma/prisma.service';

export interface DependencyHealthResponse {
  status: 'ok' | 'degraded';
  service: 'content-service';
  database: 'up' | 'down';
  cache: 'up' | 'down' | 'disabled';
}

@ApiTags('health')
// Sin versión (/health y no /v1/health): es donde lo buscan los HEALTHCHECK de Docker.
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'El proceso responde' })
  check(): HealthResponse {
    return { status: 'ok', service: 'content-service' };
  }

  @Get('db')
  @ApiExcludeEndpoint()
  async checkDatabase(): Promise<Omit<DependencyHealthResponse, 'cache'>> {
    const up = await this.prisma.isReachable();
    return {
      status: up ? 'ok' : 'degraded',
      service: 'content-service',
      database: up ? 'up' : 'down',
    };
  }

  @Get('dependencies')
  @ApiOperation({ summary: 'Estado de base de datos y cache' })
  async checkDependencies(): Promise<DependencyHealthResponse> {
    const [databaseUp, cacheUp] = await Promise.all([
      this.prisma.isReachable(),
      this.cache.isReachable(),
    ]);

    return {
      status: databaseUp ? 'ok' : 'degraded',
      service: 'content-service',
      database: databaseUp ? 'up' : 'down',
      cache: process.env.REDIS_URL ? (cacheUp ? 'up' : 'down') : 'disabled',
    };
  }
}
