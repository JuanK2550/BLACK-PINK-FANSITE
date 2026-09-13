// Configuración de Next.js: variables de entorno, imágenes, cabeceras de seguridad y Sentry.

import { existsSync } from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
import { securityHeaders } from './src/lib/security-headers';

const rootEnv = path.resolve(process.cwd(), '../.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

const cdnUrl = process.env.NEXT_PUBLIC_UPLOAD_CDN_URL;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@blackpink/ui'],
  images: {
    remotePatterns: cdnUrl ? [{ protocol: 'https', hostname: new URL(cdnUrl).hostname }] : [],
    // Las fotos de /public no cambian: un mes de caché ahorra transformaciones del plan gratuito.
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Metadatos siempre en el <head>, también para los buscadores.
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({
          // Mismo valor por defecto que el cliente del chat, o la CSP bloquearía sus llamadas.
          apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
          sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          cdnUrl,
          vercelEnv: process.env.VERCEL_ENV,
          https:
            process.env.VERCEL === '1' ||
            (process.env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('https://'),
          development: process.env.NODE_ENV === 'development',
        }),
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const { SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT } = process.env;

// Con credenciales de Sentry se suben los source maps al compilar y se borran del despliegue.
export default SENTRY_AUTH_TOKEN && SENTRY_ORG && SENTRY_PROJECT
  ? withSentryConfig(withNextIntl(nextConfig), {
      org: SENTRY_ORG,
      project: SENTRY_PROJECT,
      authToken: SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      telemetry: false,
    })
  : withNextIntl(nextConfig);
