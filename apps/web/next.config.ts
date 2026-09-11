import { existsSync } from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// El .env unico vive en la raiz del monorepo, compartido con los microservicios.
// Next solo lee .env dentro de apps/web, asi que lo cargamos a mano antes de compilar.
const rootEnv = path.resolve(process.cwd(), '../../.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

const cdnUrl = process.env.NEXT_PUBLIC_UPLOAD_CDN_URL;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // packages/ui se consume como codigo fuente TypeScript, sin paso de build propio.
  transpilePackages: ['@blackpink/ui'],
  images: {
    // Aqui se anaden los dominios desde los que serviras tus propias imagenes.
    remotePatterns: cdnUrl ? [{ protocol: 'https', hostname: new URL(cdnUrl).hostname }] : [],
  },
  eslint: {
    // El lint se ejecuta como tarea propia de Turborepo (pnpm lint).
    ignoreDuringBuilds: true,
  },
  /*
   * METADATOS SIEMPRE EN EL <head>, NUNCA EN STREAMING.
   *
   * Next 15 envía los metadatos de una página DINÁMICA después del resto, y
   * los coloca en el <body>. En este sitio la dinámica es /quiz, porque su
   * `generateMetadata` lee `?score=&total=` para elegir la tarjeta Open Graph
   * del resultado. Medido: la meta descripción, el canónico y las etiquetas
   * Open Graph de /quiz salían DENTRO DEL CUERPO —también con el agente de
   * Googlebot— y Lighthouse bajaba su SEO a 91.
   *
   * Una tarjeta para compartir cuyas etiquetas no están en el <head> es una
   * tarjeta que muchos lectores de enlaces no encuentran. Desactivarlo aquí no
   * cuesta nada: ese `generateMetadata` solo lee la URL y las traducciones.
   */
  htmlLimitedBots: /.*/,
};

/*
 * El plugin de next-intl conecta `src/i18n/request.ts` con el servidor: es lo
 * que hace que `getTranslations()` sepa que idioma se esta sirviendo sin que
 * haya que pasarlo por props hasta el ultimo componente.
 */
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
