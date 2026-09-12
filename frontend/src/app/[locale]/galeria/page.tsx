// Página de la galería de fotos.

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { Container } from '@blackpink/ui';
import { routing } from '../../../i18n/routing';
import { JsonLd } from '../../../components/layout/json-ld';
import { PageHeader } from '../../../components/layout/page-header';
import { GalleryGrid } from '../../../components/gallery/gallery-grid';
import { getGalleryPhotos } from '../../../lib/gallery';
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '../../../lib/seo';

const PATH = '/galeria';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'GalleryPage' });
  return buildMetadata({ title: t('title'), description: t('description'), path: PATH, locale });
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'GalleryPage' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });

  const photos = getGalleryPhotos();

  const keys = [
    'all',
    'allYears',
    'grupo',
    'filterSubject',
    'filterYear',
    'count',
    'open',
    'close',
    'prev',
    'next',
    'source',
    'lightbox',
    'alt',
    'altYear',
  ] as const;

  const labels = Object.fromEntries(keys.map((key) => [key, t.raw(key) as string]));

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

      <PageHeader title={t('title')} description={t('description')} aside={`${photos.length}`} />

      <Container width="wide" className="pb-section">
        <GalleryGrid photos={photos} labels={labels} />

        <p className="border-line text-fg-subtle mt-block max-w-prose text-pretty border-t pt-6 text-xs">
          {t('provenance')}
        </p>
      </Container>
    </>
  );
}
