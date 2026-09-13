// Errores del navegador a Sentry; sin NEXT_PUBLIC_SENTRY_DSN el SDK no se descarga.

import { sentryOptions } from './lib/sentry';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  void import('@sentry/nextjs').then((Sentry) => Sentry.init(sentryOptions()));
}
