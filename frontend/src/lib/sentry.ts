// Opciones de Sentry para la web: sin datos personales, sin trazas y sin grabar sesiones.

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

export function stripQuery(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  if (event.request) {
    const userAgent = event.request.headers?.['user-agent'];
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    if (event.request.url) event.request.url = stripQuery(event.request.url);
    event.request.headers = userAgent ? { 'user-agent': userAgent } : {};
  }
  delete event.user;
  return event;
}

export function scrubBreadcrumb<T extends { category?: string; data?: Record<string, unknown> }>(
  breadcrumb: T,
): T {
  if (typeof breadcrumb.data?.url === 'string') {
    breadcrumb.data.url = stripQuery(breadcrumb.data.url);
  }
  return breadcrumb;
}

export function sentryOptions() {
  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  };
}
