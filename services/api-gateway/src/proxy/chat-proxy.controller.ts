import { Body, Controller, Get, Logger, Post, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

/**
 * ============================================================================
 * PASO DE CONVERSACION HACIA chatbot-service
 * ============================================================================
 * El proxy general de este gateway NO sirve para el chat, y no por descuido:
 *
 *   - Solo reenvia GET y HEAD. El chat es POST, porque el mensaje y el
 *     historial no caben con dignidad en una URL.
 *   - Cachea la respuesta. Una conversacion no se cachea jamas.
 *   - BUFERIZA el cuerpo entero antes de devolverlo. Eso convertiria un
 *     stream que escribe palabra a palabra en un bloque que aparece de golpe
 *     al final: el streaming seguiria "funcionando" y nadie lo notaria hasta
 *     mirar la pantalla.
 *
 * Por eso hay un controlador aparte que **canaliza** en vez de bufferizar. Y
 * sigue siendo lista blanca: solo estas dos rutas, no un comodin hacia
 * chatbot-service.
 *
 * LA CLAVE DE GOOGLE NO PASA POR AQUI. El navegador habla con el gateway, el
 * gateway con chatbot-service, y solo ese ultimo con Gemini.
 * ============================================================================
 */
@ApiTags('chat')
@Controller()
export class ChatProxyController {
  private readonly logger = new Logger(ChatProxyController.name);
  private readonly baseUrl: string;

  /** Un turno puede tardar; no es una API de datos. */
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
    // Si el visitante cierra la pestana, se corta tambien aguas arriba: seguir
    // generando para nadie gasta cuota de Gemini que no vuelve.
    req.on('close', () => controller.abort());

    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const upstream = await fetch(`${this.baseUrl}/api/v1/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      res.status(upstream.status);
      res.setHeader('content-type', upstream.headers.get('content-type') ?? 'text/event-stream');
      res.setHeader('cache-control', 'no-cache, no-transform');
      res.setHeader('x-gateway-upstream', 'chatbot');
      // Sin esto, un proxy con bufer acumula la respuesta y la entrega de
      // golpe: el stream funciona y el visitante no lo nota.
      res.setHeader('x-accel-buffering', 'no');
      res.flushHeaders?.();

      const reader = upstream.body?.getReader();
      if (!reader) {
        res.end();
        return;
      }

      /*
       * Se escribe cada trozo EN CUANTO llega. Nada de acumular: es la
       * diferencia entre un asistente que escribe y uno que aparece.
       */
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
        // El error viaja como un evento mas del flujo: el cliente ya sabe
        // interpretarlos y no necesita una segunda forma de fallar.
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
      // Sin sugerencias el chat sigue siendo usable: se responde vacio en vez
      // de romper la apertura del panel.
      res.status(200).json({ data: { suggestions: [] }, meta: {}, error: null });
    }
  }
}
