// Configuración de Next.js: variables de entorno, imágenes remotas y cabeceras.

import { existsSync } from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const rootEnv = path.resolve(process.cwd(), '../.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

const cdnUrl = process.env.NEXT_PUBLIC_UPLOAD_CDN_URL;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@blackpink/ui'],
  images: {
    remotePatterns: cdnUrl ? [{ protocol: 'https', hostname: new URL(cdnUrl).hostname }] : [],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Metadatos siempre en el <head>, también para los buscadores.
  htmlLimitedBots: /.*/,
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
