import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { longestWordEm } from '../../../../lib/display-fit';
import { formatDate } from '../../../../lib/format';
import { routing } from '../../../../i18n/routing';
import { Container, SectionHeading } from '@blackpink/ui';
import { AlbumCover } from '../../../../components/album-cover';
import { AlbumTracklist } from '../../../../components/pages/album-tracklist';
import { JsonLd } from '../../../../components/json-ld';
import { ParallaxCover } from '../../../../components/pages/parallax-cover';
import { ApiError, getAlbum, getAlbums } from '../../../../lib/api';
import { albumJsonLd, breadcrumbJsonLd, buildMetadata } from '../../../../lib/seo';

interface PageProps {
  params: Promise<{ slug: string; locale: Locale }>;
}

export async function generateStaticParams() {
  try {
    const { items } = await getAlbums({ locale: routing.defaultLocale, limit: 100 });
    return routing.locales.flatMap((locale) =>
      items.map((album) => ({ locale, slug: album.slug })),
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;

  try {
    const album = await getAlbum(slug, { locale });
    return buildMetadata({
      title: album.title,
      description:
        album.description ??
        `${album.title}, ${album.formatLabel ?? album.type} de BLACKPINK publicado en ${album.year}.`,
      path: `/discografia/${slug}`,
      locale,
    });
  } catch {
    return { title: 'No encontrado', robots: { index: false, follow: true } };
  }
}

export default async function AlbumPage({ params }: PageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'AlbumPage' });
  const disco = await getTranslations({ locale, namespace: 'DiscographyPage' });
  const types = await getTranslations({ locale, namespace: 'AlbumTypes' });
  const embed = await getTranslations({ locale, namespace: 'Embed' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });
  const a11y = await getTranslations({ locale, namespace: 'A11y' });

  let album;
  try {
    album = await getAlbum(slug, { locale });
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  return (
    <>
      <JsonLd data={albumJsonLd(album, `/discografia/${slug}`, locale)} />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: nav('grupo'), path: '/' },
            { name: disco('title'), path: '/discografia' },
            { name: album.title, path: `/discografia/${slug}` },
          ],
          locale,
        )}
      />

      <Container width="wide" className="pt-block pb-section">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* --- Portada con parallax --- */}
          <div className="lg:col-span-5">
            <ParallaxCover>
              <AlbumCover
                cover={album}
                title={album.title}
                alt={a11y('coverAlt', { title: album.title })}
                glyph={String(album.year)}
                sizes="(max-width: 1024px) 92vw, 40vw"
                /* La unica portada del sitio que domina la primera pantalla:
                   es la imagen mas grande de la pagina y su LCP. */
                priority
              />
            </ParallaxCover>
          </div>

          {/* --- Datos de lanzamiento --- */}
          <div className="@container lg:col-span-7 lg:pt-6">
            <h1
              className="font-display text-fg bp-fit-title text-balance font-extrabold"
              style={{ '--bp-title-em': longestWordEm(album.title) } as CSSProperties}
            >
              {album.title}
            </h1>

            {album.description ? (
              <p className="text-fg-muted mt-5 max-w-prose text-pretty text-lg">
                {album.description}
              </p>
            ) : null}

            <dl className="border-line mt-block grid gap-x-8 gap-y-4 border-t pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-fg-subtle text-2xs" data-uppercase>
                  {t('released')}
                </dt>
                <dd className="text-fg mt-1 text-base">
                  <time dateTime={album.releaseDate} data-numeric>
                    {formatDate(album.releaseDate, locale)}
                  </time>
                </dd>
              </div>

              <div>
                <dt className="text-fg-subtle text-2xs" data-uppercase>
                  {disco('filterType')}
                </dt>
                <dd className="text-fg mt-1 text-base">{album.formatLabel ?? types(album.type)}</dd>
              </div>

              {album.label ? (
                <div>
                  <dt className="text-fg-subtle text-2xs" data-uppercase>
                    {t('label')}
                  </dt>
                  <dd className="text-fg mt-1 text-base">{album.label}</dd>
                </div>
              ) : null}

              <div>
                <dt className="text-fg-subtle text-2xs" data-uppercase>
                  {t('tracklist')}
                </dt>
                <dd data-numeric className="text-fg mt-1 text-base">
                  {album.trackCount}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Container>

      {/* --- Lista de canciones ------------------------------------------- */}
      <Container width="wide" className="pb-section">
        <SectionHeading title={t('tracklist')} />

        {/*
          El tracklist es de CLIENTE porque tiene estado: cual de las filas
          tiene el reproductor abierto. Solo esa lista lo es; el resto de la
          ficha sigue renderizandose en el servidor.
        */}
        <AlbumTracklist
          tracks={album.tracks}
          locale={locale}
          labels={{
            titleTrack: t('titleTrack'),
            /*
             * `.raw()` y no `embed(...)`: la cadena lleva `{title}` y quien lo
             * sustituye es el componente, no next-intl. Con la llamada normal,
             * next-intl intenta formatear el ICU sin recibir la variable y
             * lanza FORMATTING_ERROR en cada ficha.
             */
            spotifyTitle: embed.raw('spotifyTitle') as string,
            openOnSpotify: embed('openOnSpotify'),
            unavailable: embed('unavailable'),
            // Mismas razones que `spotifyTitle`: llevan `{title}` y lo
            // sustituye el componente.
            playTrack: embed.raw('playTrack') as string,
            closeTrack: embed.raw('closeTrack') as string,
          }}
        />
      </Container>
    </>
  );
}
