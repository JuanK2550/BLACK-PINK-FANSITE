// Errores 500 a Sentry sin datos personales; sin SENTRY_DSN el SDK ni se carga.

import type * as SentryNode from '@sentry/node';

type Sentry = typeof SentryNode;

export interface ScrubbableEvent {
  request?: {
    url?: string;
    data?: unknown;
    cookies?: unknown;
    query_string?: unknown;
    headers?: Record<string, string>;
  };
  user?: unknown;
}

let sentry: Sentry | undefined;

export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  if (event.request) {
    const userAgent = event.request.headers?.['user-agent'];
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    if (event.request.url) event.request.url = event.request.url.split(/[?#]/)[0];
    event.request.headers = userAgent ? { 'user-agent': userAgent } : {};
  }
  delete event.user;
  return event;
}

export function initSentry(service: string, env: NodeJS.ProcessEnv = process.env): boolean {
  if (sentry) return true;

  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) return false;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sentry = require('@sentry/node') as Sentry;
  sentry.init({
    dsn,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV || 'production',
    release: env.RAILWAY_GIT_COMMIT_SHA || env.RENDER_GIT_COMMIT || undefined,
    sendDefaultPii: false,
    initialScope: { tags: { service } },
    // Ni cuerpos de petición (audio, mensajes del chat) ni cabeceras.
    integrations: [sentry.httpIntegration({ maxIncomingRequestBodySize: 'none' })],
    beforeSend: (event) => scrubEvent(event),
  });

  return true;
}

export function captureServerError(exception: unknown, status: number): void {
  sentry?.captureException(exception, { tags: { status: String(status) } });
}
