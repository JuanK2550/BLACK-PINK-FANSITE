import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@blackpink/types';

/*
 * VERSION_NEUTRAL es obligatorio aqui.
 *
 * Con el versionado por URI activado y una version por defecto, Nest le pone
 * el prefijo /v1 a TODOS los controladores, incluidos los que estan excluidos
 * del prefijo global /api. El resultado seria /v1/health, y los healthcheck de
 * los Dockerfile y del compose (que llaman a /health) empezarian a devolver
 * 404 sin que nadie se entere hasta que un contenedor se reinicia en bucle.
 *
 * Este servicio se estreno con el fallo puesto: sin `configureService` no se
 * notaba, y al conectarlo en esta fase /health empezo a dar 404.
 */
@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  /** Contrato compartido por los cinco servicios desde la Fase 1. No cambia. */
  @Get()
  @ApiOperation({ summary: 'El proceso responde' })
  check(): HealthResponse {
    return { status: 'ok', service: 'chatbot-service' };
  }
}
