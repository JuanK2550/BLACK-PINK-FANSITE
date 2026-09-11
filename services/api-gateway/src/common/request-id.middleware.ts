import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * ============================================================================
 * IDENTIFICADOR DE PETICION
 * ============================================================================
 * Cada peticion recibe un identificador que:
 *
 *   1. se respeta si el cliente ya trae uno (asi una traza que empieza en el
 *      navegador o en otro sistema no se parte en dos al llegar aqui);
 *   2. viaja a los servicios aguas arriba en la misma cabecera;
 *   3. vuelve al cliente en la respuesta, para que pueda citarlo al reportar
 *      un fallo;
 *   4. aparece en cada linea de log del gateway.
 *
 * Sin esto, depurar un fallo intermitente en tres procesos distintos consiste
 * en cruzar marcas de tiempo a ojo.
 *
 * El identificador que llega de fuera se SANEA antes de reusarlo: es una
 * cabecera controlada por el cliente y acaba escrita en los logs, asi que sin
 * limpiarla se pueden inyectar saltos de linea y falsear entradas de log.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const incoming = request.headers[REQUEST_ID_HEADER];
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming;

    const requestId = sanitize(candidate) ?? randomUUID();

    request.headers[REQUEST_ID_HEADER] = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}

/** Solo caracteres seguros y longitud acotada; si no, se descarta. */
function sanitize(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 128) return null;
  return /^[\w.:-]+$/.test(trimmed) ? trimmed : null;
}
