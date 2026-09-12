// sitemap.xml con todas las páginas en los tres idiomas.

import type { MetadataRoute } from 'next';
import { routing } from '../i18n/routing';
import { getAlbums, getMembers } from '../lib/api';
import { SITE_URL } from '../lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
