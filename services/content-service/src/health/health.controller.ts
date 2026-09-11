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

/**
 * Las rutas de salud quedan FUERA del prefijo /api y del versionado: un
 * orquestador tiene que poder comprobarlas sin conocer la version de la API.
 */
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
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Contrato acordado en la Fase 1 y compartido por los cinco servicios.
   * NO cambia: hay codigo y orquestadores que dependen de esta forma exacta.
   */
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

  /**
   * Comprobacion profunda. Devuelve 200 aunque haya dependencias caidas: quien
   * la consulte decide que hacer con "degraded" segun sea una sonda de arranque
   * o de trafico. Un 503 aqui sacaria el servicio del balanceador por una
   * cache caida, cuando puede seguir sirviendo perfectamente desde la base.
   */
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
