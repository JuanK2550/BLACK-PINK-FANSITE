import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * ============================================================================
 * LIMITE DE USO DEL SITIO
 * ============================================================================
 * NO CONFUNDIR CON LA CUOTA DE GEMINI. Son dos limites distintos y ninguno
 * sustituye al otro:
 *
 *   - Este de aqui protege AL SITIO de que una sola IP consuma la cuota
 *     compartida de todos los visitantes. Lo decidimos nosotros.
 *   - La cuota del plan gratuito de Google la decide Google, es global para la
 *     clave y se agota aunque nadie abuse. Cuando salta, el visitante ve el
 *     mensaje de "vuelve en un rato", no un 429.
 *
 * Un visitante puede toparse con el primero portandose mal, y con el segundo
 * sin hacer nada raro. Por eso los mensajes son distintos.
 *
 * DOS VENTANAS:
 *   short    20 mensajes por minuto y por IP: frena el envio automatizado.
 *   session  200 mensajes por sesion y por IP: frena el goteo sostenido, que
 *            no dispara nunca el limite por minuto pero vacia la cuota diaria.
 *
 * El `sessionId` NO identifica a una persona: es un valor opaco que genera el
 * navegador. Se usa como parte de la clave y no se guarda en ningun sitio.
 * ============================================================================
 */
@Injectable()
export class ChatThrottlerGuard extends ThrottlerGuard {
  /**
   * La ventana larga se cuenta por IP **y** sesion; la corta, solo por IP.
   *
   * Si la larga fuese solo por sesion, bastaria con generar un `sessionId`
   * nuevo para empezar de cero. Si fuese solo por IP, una red compartida
   * -una universidad, una oficina- gastaria el cupo entre todos.
   */
  protected override generateKey(context: ExecutionContext, suffix: string, name: string): string {
    const base = super.generateKey(context, suffix, name);
    if (name !== 'session') return base;

    const request = context.switchToHttp().getRequest<Request>();
    const sessionId =
      typeof request.body === 'object' && request.body !== null && 'sessionId' in request.body
        ? String((request.body as { sessionId?: unknown }).sessionId ?? '')
        : '';

    return `${base}:${sessionId.slice(0, 64)}`;
  }
}
