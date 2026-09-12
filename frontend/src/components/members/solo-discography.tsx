// Discografía en solitario de una integrante, con un solo reproductor abierto.
'use client';

import { useState } from 'react';
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
  };
}

export function SoloDiscography({ works, locale, labels }: SoloDiscographyProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="mt-block grid gap-x-12 gap-y-16 lg:grid-cols-2">
      {works.map((work, index) => (
        <Reveal as="li" key={work.slug} delay={Math.min(index, 6) * 0.04}>
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
        </Reveal>
      ))}
    </ul>
  );
}
