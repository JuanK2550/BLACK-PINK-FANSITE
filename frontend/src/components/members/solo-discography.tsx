// Discografía en solitario de una integrante, con un solo reproductor abierto.
'use client';

import { useMemo, useState } from 'react';
import type { Locale, SoloWork } from '@blackpink/types';
import { EmbedPlayer, Reveal } from '@blackpink/ui';
import { AlbumCover } from '../discography/album-cover';
import { AlbumTracklist } from '../discography/album-tracklist';

export interface SoloDiscographyProps {
  works: SoloWork[];
  locale: Locale;
  labels: {
    coverAlt: string;
    titleTrack: string;
    featuring: string;
    tracks: string;
    spotifyTitle: string;
    openOnSpotify: string;
    unavailable: string;
    playTrack: string;
    closeTrack: string;
    groupReleases: string;
    groupSingles: string;
  };
}

export function SoloDiscography({ works, locale, labels }: SoloDiscographyProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Un disco de doce canciones al lado de un sencillo dejaba media columna vacia:
  // cada grupo tiene su propia rejilla y dentro todas las fichas miden parecido.
  const { discos, sencillos } = useMemo(
    () => ({
      discos: works.filter((work) => work.tracks.length > 1),
      sencillos: works.filter((work) => work.tracks.length <= 1),
    }),
    [works],
  );

  function Ficha({ work, index }: { work: SoloWork; index: number }) {
    return (
      <Reveal as="li" key={work.slug} delay={Math.min(index, 6) * 0.04}>
        <div className="border-line border-t pt-5">
          <div className="flex items-start gap-5">
            <AlbumCover
              cover={work}
              title={work.title}
              alt={labels.coverAlt.replace('{title}', work.title)}
              variant="thumb"
              glyph={work.releaseDate.slice(2, 4)}
              sizes="96px"
              className="w-24 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-display text-fg text-balance text-xl font-bold">{work.title}</p>
              <p className="text-fg-muted mt-1 text-sm">
                {work.formatLabel ?? work.type}
                {' · '}
                <time dateTime={work.releaseDate} data-numeric>
                  {work.releaseDate.slice(0, 4)}
                </time>
                {work.tracks.length > 1 ? (
                  <>
                    {' · '}
                    <span data-numeric>
                      {labels.tracks.replace('{count}', String(work.tracks.length))}
                    </span>
                  </>
                ) : null}
              </p>
              {work.description ? (
                <p className="text-fg-subtle mt-2 text-pretty text-sm">{work.description}</p>
              ) : null}
            </div>
          </div>

          {work.tracks.length > 0 ? (
            <AlbumTracklist
              tracks={work.tracks}
              locale={locale}
              density="compact"
              openId={openId}
              onOpenChange={setOpenId}
              labels={{
                titleTrack: labels.titleTrack,
                featuring: labels.featuring,
                spotifyTitle: labels.spotifyTitle,
                openOnSpotify: labels.openOnSpotify,
                unavailable: labels.unavailable,
                playTrack: labels.playTrack,
                closeTrack: labels.closeTrack,
              }}
            />
          ) : (
            <EmbedPlayer
              className="mt-4"
              title={work.title}
              spotify={
                work.spotifyId
                  ? {
                      id: work.spotifyId,
                      embedUrl: `https://open.spotify.com/embed/track/${work.spotifyId}`,
                      watchUrl: `https://open.spotify.com/track/${work.spotifyId}`,
                    }
                  : null
              }
              labels={{
                spotifyTitle: labels.spotifyTitle,
                openOnSpotify: labels.openOnSpotify,
                unavailable: labels.unavailable,
              }}
            />
          )}
        </div>
      </Reveal>
    );
  }

  return (
    <div className="mt-block flex flex-col gap-16">
      {discos.length > 0 ? (
        <section>
          <p className="text-fg-subtle text-2xs" data-uppercase>
            {labels.groupReleases}
          </p>

          <ul className="mt-5 flex max-w-3xl flex-col gap-12">
            {discos.map((work, index) => (
              <Ficha key={work.slug} work={work} index={index} />
            ))}
          </ul>
        </section>
      ) : null}

      {sencillos.length > 0 ? (
        <section>
          <p className="text-fg-subtle text-2xs" data-uppercase>
            {labels.groupSingles}
          </p>

          <ul className="mt-5 grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {sencillos.map((work, index) => (
              <Ficha key={work.slug} work={work} index={index} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
