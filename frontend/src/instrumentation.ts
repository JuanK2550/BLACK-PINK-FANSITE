// Errores del servidor de la web (páginas y rutas) a Sentry, si hay DSN.

import type { Instrumentation } from 'next';
import { sentryOptions } from './lib/sentry';

export async function register(): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.NEXT_RUNTIME !== 'nodejs') return;

  const Sentry = await import('@sentry/nextjs');
  Sentry.init(sentryOptions());
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.NEXT_RUNTIME !== 'nodejs') return;

  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
};
