import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { Container } from '@blackpink/ui';
import { routing } from '../../../i18n/routing';
import { JsonLd } from '../../../components/json-ld';
import { PageHeader } from '../../../components/pages/page-header';
import { GalleryGrid } from '../../../components/pages/gallery-grid';
import { getGalleryPhotos } from '../../../lib/gallery';
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '../../../lib/seo';

const PATH = '/galeria';

/**
 * ============================================================================
 * GALERÍA
 * ============================================================================
 * Sesenta fotografías de Wikimedia Commons, todas bajo CC BY, CC BY-SA o CC0.
 * El acopio, el filtro de licencia y la comprobación de identidad viven en
 * `infra/scripts/commons-gallery.mjs`; aquí solo se compone.
 *
 * ES ESTÁTICA DEL TODO. Los datos salen de un JSON versionado, así que no hay
 * ninguna llamada de red en el render: la página se genera en el build para
 * los tres idiomas y no depende de que la API esté viva.
 *
 * LAS ETIQUETAS SE PASAN EN CRUDO (`t.raw`), como en el quiz: varias llevan
 * `{n}`, `{quien}` o `{ano}` y quien sustituye es el componente. Con la llamada
 * normal, next-intl formatearía el ICU sin recibir la variable y lanzaría
 * FORMATTING_ERROR. De paso evita meter el namespace en `CLIENT_NAMESPACES`,
 * que lo haría viajar en el bundle de todas las páginas.
 * ============================================================================
 */

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

        {/*
         * La procedencia, una vez y al pie: de dónde salen todas y bajo qué
         * condiciones. El crédito individual va en cada foto —lo exige la
         * licencia—; esto explica el conjunto.
         */}
        <p className="border-line text-fg-subtle mt-block max-w-prose text-pretty border-t pt-6 text-xs">
          {t('provenance')}
        </p>
      </Container>
    </>
  );
}
