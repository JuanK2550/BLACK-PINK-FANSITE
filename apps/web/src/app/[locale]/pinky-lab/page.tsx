import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '../../../i18n/routing';
import { PinkyLab } from '../../../components/chat/pinky-lab';

/**
 * ============================================================================
 * LABORATORIO DE PINKY  ·  /[locale]/pinky-lab
 * ============================================================================
 * HERRAMIENTA DE TALLER, no una pagina del sitio. Pinta a la ardilla en sus
 * cinco estados y en tres tamanos a la vez, para poder juzgar el movimiento
 * mirandolo en lugar de deducirlo del codigo: los cinco estados conviven en
 * pantalla y las diferencias entre "pensando" y "escuchando" se ven de un
 * vistazo, sin abrir el chat y provocar cada estado a mano.
 *
 * POR QUE NO PASA POR `messages/{es,en,ko}.json`. La regla de que ningun
 * componente lleve texto dentro existe para el contenido que lee un visitante.
 * Aqui las etiquetas son los identificadores del codigo -`idle`, `speaking`,
 * `80px`- y traducirlos seria traducir nombres de variables. Lo que si se
 * respeta es que esto no forme parte del sitio publico:
 *
 *   - `noindex, nofollow` en los metadatos,
 *   - fuera de `sitemap.ts`, que lleva una lista explicita de rutas,
 *   - sin enlace desde ninguna navegacion.
 *
 * Se llega escribiendo la URL, que es exactamente lo que hace quien la usa.
 * ============================================================================
 */

export const metadata: Metadata = {
  title: 'PINKY · laboratorio',
  robots: { index: false, follow: false },
};

// Las tres rutas se prerenderizan como el resto del sitio. Sin esto, Next
// intenta resolver el segmento [locale] por su cuenta al arrancar y la pagina
// devuelve 500 antes de llegar a pintarse.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function PinkyLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PinkyLab />;
}
