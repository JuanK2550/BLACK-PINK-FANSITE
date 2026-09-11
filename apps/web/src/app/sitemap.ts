import type { MetadataRoute } from 'next';
import { routing } from '../i18n/routing';
import { getAlbums, getMembers } from '../lib/api';
import { SITE_URL } from '../lib/seo';

/**
 * ============================================================================
 * SITEMAP POR IDIOMA
 * ============================================================================
 * Cada URL se declara UNA vez, con sus tres versiones en `alternates.languages`
 * en lugar de listar tres entradas sueltas. Es la diferencia entre decirle a un
 * buscador "hay tres páginas parecidas" y decirle "es la misma página en tres
 * idiomas": lo segundo evita que compitan entre sí por la misma consulta y
 * permite servir la versión correcta según quién busque.
 *
 * Se genera contra la API, no contra una lista escrita a mano: un álbum nuevo
 * entra en el sitemap solo, y una lista a mano se queda desactualizada el día
 * que alguien añade contenido y no se acuerda de tocar este archivo.
 * ============================================================================
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Las rutas estáticas, sin prefijo de idioma. `changeFrequency` y `priority`
  // son pistas, no promesas: se declaran acordes a la realidad del sitio.
  const staticPaths: {
    path: string;
    priority: number;
    changeFrequency: 'daily' | 'weekly' | 'monthly';
  }[] = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/grupo', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/integrantes', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/integrantes/comparar', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/discografia', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/cronologia', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/curiosidades', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/premios', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/creditos', priority: 0.3, changeFrequency: 'monthly' },
  ];

  /*
   * El contenido dinámico se pide en el idioma por defecto porque solo se
   * necesitan los slugs, que son iguales en los tres. Si la API no responde,
   * el sitemap sale con las rutas estáticas en vez de romper el build: un
   * sitemap incompleto es recuperable, un build caído no.
   */
  const [members, albums] = await Promise.all([
    getMembers({ locale: routing.defaultLocale }).catch(() => []),
    getAlbums({ locale: routing.defaultLocale, limit: 100 })
      .then((page) => page.items)
      .catch(() => []),
  ]);

  const dynamicPaths = [
    ...members.map((member) => ({
      path: `/integrantes/${member.slug}`,
      priority: 0.8,
      changeFrequency: 'monthly' as const,
    })),
    ...albums.map((album) => ({
      path: `/discografia/${album.slug}`,
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    })),
  ];

  const lastModified = new Date();

  return [...staticPaths, ...dynamicPaths].map((entry) => ({
    url: `${SITE_URL}/${routing.defaultLocale}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${entry.path}`]),
      ),
    },
  }));
}
