// Reenvía el chat en streaming a chatbot-service.

import { Body, Controller, Get, Logger, Post, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

@ApiTags('chat')
@Controller()
export class ChatProxyController {
  private readonly logger = new Logger(ChatProxyController.name);
  private readonly baseUrl: string;

  private readonly timeoutMs = 60_000;

  constructor(config: ConfigService) {
    this.baseUrl = (
      config.get<string>('CHATBOT_SERVICE_URL')?.trim() || 'http://localhost:4003'
    ).replace(/\/+$/, '');
  }

  @Post('chat')
  @ApiOperation({
    summary: 'Conversa con PINKY. Canaliza el SSE de chatbot-service sin bufferizar.',
  })
  async chat(@Body() body: unknown, @Req() req: Request, @Res() res: Response): Promise<void> {
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const upstream = await fetch(`${this.baseUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // Sin la IP del visitante, el límite por IP del chatbot sería uno solo para todo el sitio.
          ...(req.ip ? { 'x-forwarded-for': req.ip } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      res.status(upstream.status);
      res.setHeader('content-type', upstream.headers.get('content-type') ?? 'text/event-stream');
      res.setHeader('cache-control', 'no-cache, no-transform');
      res.setHeader('x-gateway-upstream', 'chatbot');
      res.setHeader('x-accel-buffering', 'no');
      res.flushHeaders?.();

      const reader = upstream.body?.getReader();
      if (!reader) {
        res.end();
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (res.writableEnded) {
          await reader.cancel().catch(() => undefined);
          break;
        }
        res.write(value);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        this.logger.warn(`chatbot-service no responde: ${String(error)}`);
      }

      if (!res.headersSent) {
        res.status(503).setHeader('content-type', 'text/event-stream');
        res.flushHeaders?.();
      }

      if (!res.writableEnded) {
        res.write('event: error\n');
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            code: 'UPSTREAM',
            message: 'El asistente no esta disponible ahora mismo.',
          })}\n\n`,
        );
      }
    } finally {
      clearTimeout(timer);
      if (!res.writableEnded) res.end();
    }
  }

  @Get('chat/suggestions')
  @ApiOperation({ summary: 'Preguntas sugeridas. Respuesta normal, no stream.' })
  async suggestions(
    @Query('locale') locale: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const url = new URL(`${this.baseUrl}/api/v1/chat/suggestions`);
    if (locale) url.searchParams.set('locale', locale);

    try {
      const upstream = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const payload: unknown = await upstream.json();
      res.status(upstream.status).json(payload);
    } catch {
      res.status(200).json({ data: { suggestions: [] }, meta: {}, error: null });
    }
  }
}
