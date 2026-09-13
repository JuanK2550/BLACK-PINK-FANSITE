// Envía a Sentry un error que ha recogido una pantalla de error; sin DSN no descarga nada.

export function reportError(error: unknown): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  void import('@sentry/nextjs')
    .then((Sentry) => Sentry.captureException(error))
    .catch(() => undefined);
}
