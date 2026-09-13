// Reenvía el audio a speech-service sin leerlo.

import { Controller, Logger, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

@ApiTags('speech')
@Controller()
export class SpeechProxyController {
  private readonly logger = new Logger(SpeechProxyController.name);
  private readonly baseUrl: string;

  private readonly timeoutMs = 60_000;

  constructor(config: ConfigService) {
    this.baseUrl = (
      config.get<string>('SPEECH_SERVICE_URL')?.trim() || 'http://localhost:4004'
    ).replace(/\/+$/, '');
  }

  @Post('transcribe')
  @Throttle({ expensive: {} })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Reenvia un audio a speech-service. No lo lee, no lo cachea y no lo guarda.',
  })
  async transcribe(@Req() req: Request, @Res() res: Response): Promise<void> {
    const controller = new AbortController();

    // res y no req: con el cuerpo sin leer, el 'close' de req salta enseguida y cortaría la subida.
    res.on('close', () => {
      if (!res.writableEnded) controller.abort();
    });

    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const contentType = req.headers['content-type'];
      if (!contentType?.startsWith('multipart/form-data')) {
        res.status(415).json({
          data: null,
          meta: { timestamp: new Date().toISOString(), service: 'api-gateway' },
          error: {
            statusCode: 415,
            message: 'Se espera multipart/form-data con un campo `audio`.',
            code: 'UNSUPPORTED_MEDIA_TYPE',
          },
        });
        return;
      }

      const upstream = await fetch(`${this.baseUrl}/api/v1/transcribe`, {
        method: 'POST',
        headers: {
          'content-type': contentType,
          ...(req.ip ? { 'x-forwarded-for': req.ip } : {}),
          ...(req.headers['content-length']
            ? { 'content-length': String(req.headers['content-length']) }
            : {}),
        },
        body: req as unknown as ReadableStream,
        duplex: 'half',
        signal: controller.signal,
      } as RequestInit & { duplex: 'half' });

      const payload = await upstream.text();

      res.status(upstream.status);
      res.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/json');
      res.setHeader('cache-control', 'no-store');
      res.setHeader('x-gateway-upstream', 'speech');
      res.send(payload);
    } catch (error) {
      if (!controller.signal.aborted) {
        this.logger.warn(`speech-service no responde: ${String(error)}`);
      }

      if (!res.headersSent) {
        res.status(503).json({
          data: null,
          meta: { timestamp: new Date().toISOString(), service: 'api-gateway' },
          error: {
            statusCode: 503,
            message: 'El servicio de transcripcion no esta disponible.',
            code: 'ASR_UNAVAILABLE',
          },
        });
      }
    } finally {
      clearTimeout(timer);
      if (!res.writableEnded) res.end();
    }
  }
}
