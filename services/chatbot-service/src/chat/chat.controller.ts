import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ChatRequestDto, SuggestionsQueryDto } from './chat.dto';
import { ChatService, resolveLocale, type ChatEvent } from './chat.service';

/**
 * ============================================================================
 * /api/v1/chat
 * ============================================================================
 * STREAMING POR SSE, no una respuesta de una pieza. El modelo tarda segundos
 * en terminar un parrafo; sin streaming el visitante mira un indicador de
 * carga todo ese rato, y la percepcion de un asistente lento es la de un
 * asistente roto.
 *
 * SE USA POST, aunque SSE se asocie a GET y a EventSource. El mensaje puede
 * traer mil caracteres e historial, y eso no cabe con dignidad en una URL: se
 * quedaria escrito en los logs de cada intermediario. El cliente lo consume
 * con fetch y un ReadableStream, no con EventSource.
 *
 * ESTE ENDPOINT NO USA EL ENVELOPE {data, meta, error} del resto de la API, y
 * es a proposito: un envelope describe una respuesta completa, y aqui no hay
 * una respuesta, hay un flujo. Los errores viajan como un evento mas del
 * flujo, con su codigo.
 * ============================================================================
 */
@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  @ApiOperation({
    summary: 'Conversa con PINKY. Devuelve text/event-stream, no JSON.',
    description:
      'Eventos: `token` (texto parcial), `done` (accion de navegacion y citas) y ' +
      '`error` (con codigo QUOTA, NOT_CONFIGURED o UPSTREAM). El mensaje se limita ' +
      'a 1000 caracteres y el limite por IP es independiente de la cuota de Gemini.',
  })
  async chatStream(
    @Body() body: ChatRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const locale = resolveLocale(body.locale);

    res.setHeader('content-type', 'text/event-stream; charset=utf-8');
    res.setHeader('cache-control', 'no-cache, no-transform');
    res.setHeader('connection', 'keep-alive');
    // Sin esto, un proxy con bufer acumula toda la respuesta y la entrega de
    // golpe: el stream funciona y el visitante no lo nota.
    res.setHeader('x-accel-buffering', 'no');
    res.flushHeaders?.();

    // Si el visitante cierra la pestana, se corta la generacion: seguir
    // gastando cuota para nadie es lo mismo que tirarla.
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    try {
      for await (const event of this.chat.answer(
        body.message,
        locale,
        (body.history ?? []).map((turn) => ({ role: turn.role, text: turn.text })),
        controller.signal,
        body.sessionId,
      )) {
        if (res.writableEnded) break;
        write(res, event);
      }
    } catch {
      if (!res.writableEnded) {
        write(res, {
          type: 'error',
          code: 'UPSTREAM',
          message: 'La conversacion se ha interrumpido.',
        });
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Preguntas sugeridas en el idioma pedido.' })
  suggestions(@Query() query: SuggestionsQueryDto): { suggestions: string[] } {
    return { suggestions: this.chat.suggestions(resolveLocale(query.locale)) };
  }

  @Get('status')
  @ApiOperation({
    summary: 'Estado del indice y del proveedor. Diagnostico, sin datos del visitante.',
  })
  status(): Promise<{ provider: string; configured: boolean; chunks: number }> {
    return this.chat.indexStatus();
  }
}

/**
 * Un evento SSE.
 *
 * El `type` va como nombre de evento Y dentro del JSON: el nombre permite al
 * cliente registrar manejadores distintos, y el campo permite tratarlos como
 * una union discriminada sin mirar el sobre.
 */
function write(res: Response, event: ChatEvent): void {
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}
