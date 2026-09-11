import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/seo';

/**
 * El sitio es indexable entero: no hay area privada ni contenido de pago.
 *
 * Se apunta al sitemap para que un rastreador encuentre las tres versiones de
 * idioma sin tener que descubrirlas navegando.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
