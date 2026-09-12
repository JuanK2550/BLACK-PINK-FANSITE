// Inicio: último disco con su lista de canciones.

import { getTranslations } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { EmptyState, SectionHeading, Skeleton } from '@blackpink/ui';
import { AlbumCover } from '../discography/album-cover';
import { getAlbum, getAlbums } from '../../lib/api';
import { formatDuration } from '../../lib/format';
import { SectionError, SectionFrame } from '../layout/section-frame';

export async function LatestAlbumSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' });
  const empty = await getTranslations({ locale, namespace: 'Empty' });
  const a11y = await getTranslations({ locale, namespace: 'A11y' });

  let album;
  try {
    const { items } = await getAlbums({ locale, limit: 1, sort: 'releaseDate_desc' });
    const latest = items[0];

    if (!latest) {
      return (
        <SectionFrame id="ultimo-album">
          <SectionHeading hideRule title={t('album.title')} />
          <EmptyState
            className="mt-block"
            title={empty('title')}
            description={empty('description')}
          />
        </SectionFrame>
      );
    }

    album = await getAlbum(latest.slug, { locale });
  } catch (error) {
    return (
      <SectionFrame id="ultimo-album">
        <SectionError
          locale={locale}
          heading={t('album.title')}
          detail={error instanceof Error ? error.message : undefined}
        />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame id="ultimo-album">
      <SectionHeading
        hideRule
        title={t('album.title')}
        description={t('album.description')}
        actionLabel={t('album.action')}
        actionHref={`/${locale}/discografia`}
      />

      <div className="mt-block grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <AlbumCover
            cover={album}
            title={album.title}
            alt={a11y('coverAlt', { title: album.title })}
            glyph={String(album.year)}
            sizes="(max-width: 1024px) 92vw, 40vw"
          />
          <div className="mt-4 flex items-baseline justify-between gap-4">
            <p className="font-display text-fg text-3xl font-extrabold">{album.title}</p>
            <time className="text-accent-text text-lg font-medium" dateTime={album.releaseDate}>
              {album.year}
            </time>
          </div>
          {album.formatLabel ? (
            <p className="text-fg-muted mt-1 text-sm">{album.formatLabel}</p>
          ) : null}
        </div>

        <div className="lg:col-span-7">
          <h3 className="text-fg-subtle text-2xs" data-uppercase>
            {t('album.tracklist')}
          </h3>

          <ol className="mt-4">
            {album.tracks.map((track) => (
              <li
                key={track.id}
                className="border-line hover:bg-accent-tint ease-out-soft -mx-3 flex items-baseline gap-4 border-b px-3 py-3 transition-colors duration-[var(--dur-2)] last:border-b-0"
              >
                <span data-numeric className="text-fg-subtle w-6 shrink-0 text-xs">
                  {String(track.trackNumber).padStart(2, '0')}
                </span>
                <span className="text-fg flex-1 text-base">
                  {track.localizedTitle ?? track.title}
                </span>
                {track.durationSec ? (
                  <span data-numeric className="text-fg-subtle shrink-0 text-xs">
                    {formatDuration(track.durationSec, locale)}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </SectionFrame>
  );
}

export async function LatestAlbumSectionSkeleton({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' });

  return (
    <SectionFrame id="ultimo-album">
      <SectionHeading hideRule title={t('album.title')} description={t('album.description')} />

      <div className="mt-block grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <Skeleton className="aspect-square h-auto w-full" />
          <Skeleton className="mt-4 h-9" width="60%" />
          <Skeleton className="mt-2 h-4" width="40%" />
        </div>

        <div className="lg:col-span-7">
          <Skeleton className="h-3" width="30%" />
          <div className="mt-4 flex flex-col">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="border-line flex items-center gap-4 border-b py-3.5">
                <Skeleton className="h-3 w-6 shrink-0" />
                <Skeleton className="h-4" width={`${68 - (index % 4) * 8}%`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}
