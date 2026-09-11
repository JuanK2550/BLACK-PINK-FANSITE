import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { ApiEnvelope, ApiMeta, PageMeta } from '@blackpink/types';
import { Observable, map } from 'rxjs';

/**
 * Marca para que un servicio devuelva datos ACOMPANADOS de metadatos sin tener
 * que construir el envelope a mano en cada controlador.
 *
 * Un controlador puede devolver el dato pelado y ya, o devolver esto cuando
 * tenga que informar de paginacion, de idioma o de que la respuesta salio de
 * cache. El interceptor se encarga del resto.
 */
export class Enveloped<T> {
  constructor(
    readonly data: T,
    readonly meta: Partial<ApiMeta> = {},
  ) {}
}

export function enveloped<T>(data: T, meta: Partial<ApiMeta> = {}): Enveloped<T> {
  return new Enveloped(data, meta);
}

export function paginated<T>(
  items: T[],
  pagination: PageMeta,
  meta: Partial<ApiMeta> = {},
): Enveloped<T[]> {
  return new Enveloped(items, { ...meta, pagination });
}

/**
 * Envuelve las respuestas de la API con exito en { data, meta, error }.
 *
 * LAS RUTAS DE SALUD QUEDAN FUERA, a proposito. `GET /health` tiene un
 * contrato propio acordado en la Fase 1 -exactamente { status, service }- del
 * que dependen los HEALTHCHECK de los Dockerfile, el compose y el
 * orquestador de despliegue. Envolverlo obligaria a cada sonda a entender el
 * envelope de la aplicacion, que es justo lo contrario de lo que debe ser una
 * comprobacion de salud: simple y estable.
 *
 * El criterio es el mismo que para el prefijo: lo que no cuelga de /api no es
 * la API, y no lleva su envoltorio.
 *
 * Los errores no pasan por aqui: los arma el filtro de excepciones, para que
 * las dos rutas produzcan exactamente la misma forma sin depender la una de
 * la otra.
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T> | T> {
  constructor(
    private readonly serviceName: string,
    private readonly apiPrefix = 'api',
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiEnvelope<T> | T> {
    const request = context
      .switchToHttp()
      .getRequest<{ query?: Record<string, unknown>; path?: string; url?: string }>();

    const path = request.path ?? request.url ?? '';
    if (!path.startsWith(`/${this.apiPrefix}`)) {
      return next.handle();
    }

    const locale = typeof request.query?.locale === 'string' ? request.query.locale : undefined;

    return next.handle().pipe(
      map((payload): ApiEnvelope<T> => {
        const isEnveloped = payload instanceof Enveloped;
        const data = (isEnveloped ? payload.data : payload) as T;
        const extra = isEnveloped ? payload.meta : {};

        return {
          data,
          meta: {
            timestamp: new Date().toISOString(),
            service: this.serviceName,
            ...(locale ? { locale } : {}),
            ...extra,
          },
          error: null,
        };
      }),
    );
  }
}
