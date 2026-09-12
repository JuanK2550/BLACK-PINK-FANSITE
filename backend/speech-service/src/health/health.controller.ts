// Endpoint /health del servicio de voz.

import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@blackpink/types';

@ApiTags('health')
// Sin versión (/health y no /v1/health): es donde lo buscan los HEALTHCHECK de Docker.
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'El proceso responde' })
  check(): HealthResponse {
    return { status: 'ok', service: 'speech-service' };
  }
}
