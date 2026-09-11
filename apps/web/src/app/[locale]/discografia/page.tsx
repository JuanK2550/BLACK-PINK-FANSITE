import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { routing } from '../../../i18n/routing';
import { Container } from '@blackpink/ui';
import { JsonLd } from '../../../components/json-ld';
import { DiscographyBrowser } from '../../../components/pages/discography-browser';
import { PageHeader } from '../../../components/pages/page-header';
import { getAlbums } from '../../../lib/api';
import { breadcrumbJsonLd, buildMetadata, SITE_URL, webPageJsonLd } from '../../../lib/seo';

const PATH = '/discografia';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'DiscographyPage' });
  return buildMetadata({ title: t('title'), description: t('description'), path: PATH, locale });
}

export default async function DiscographyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'DiscographyPage' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });

  // Se pide la lista completa: son nueve lanzamientos y el filtrado se hace en
  // cliente, asi que paginarla solo anadiria idas y venidas a la red.
  const { items } = await getAlbums({ locale, limit: 100, sort: 'releaseDate_desc' });

  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          name: t('title'),
          description: t('description'),
          path: PATH,
          locale,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: nav('grupo'), path: '/' },
            { name: t('title'), path: PATH },
          ],
          locale,
        )}
      />
      {/* Lista ordenada de discos, para que un buscador entienda que esta
          pagina es el indice de la discografia y no una pagina suelta. */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: t('title'),
          numberOfItems: items.length,
          itemListElement: items.map((album, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${SITE_URL}/${locale}/discografia/${album.slug}`,
            name: album.title,
          })),
        }}
      />

      <PageHeader title={t('title')} description={t('description')} />

      <Container width="wide" className="pb-section">
        <DiscographyBrowser albums={items} locale={locale} />
      </Container>
    </>
  );
}
