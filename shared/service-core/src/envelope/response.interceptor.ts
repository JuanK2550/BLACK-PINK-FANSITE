// Envuelve las respuestas en { data, meta, error }.

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { ApiEnvelope, ApiMeta, PageMeta } from '@blackpink/types';
import { Observable, map } from 'rxjs';

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
