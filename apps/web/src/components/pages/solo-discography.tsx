'use client';

import { useState } from 'react';
import type { Locale, SoloWork } from '@blackpink/types';
import { EmbedPlayer, Reveal } from '@blackpink/ui';
import { AlbumCover } from '../album-cover';
import { AlbumTracklist } from './album-tracklist';

/**
 * ============================================================================
 * LA DISCOGRAFIA EN SOLITARIO DE UNA INTEGRANTE
 * ============================================================================
 * Cada obra con su portada, su tipo, su año y TODAS sus canciones.
 *
 * Hasta la Fase 14 una obra era una sola canción con un solo reproductor: de
 * «Ruby» o de «Alter Ego», quince canciones cada uno, la ficha enseñaba una.
 *
 * UN SOLO REPRODUCTOR ABIERTO EN TODA LA FICHA, no uno por obra. El estado de
 * la pista abierta vive AQUÍ y se reparte a cada lista. Con él dentro de cada
 * lista, abrir una canción de «Ruby» y otra de «Fallen Angel» dejaba dos
 * iframes de Spotify vivos a la vez —con su JavaScript y sus cookies—, que es
 * justo lo que el montaje bajo demanda existe para evitar.
 *
 * Una obra sin lista contrastada todavía cae al reproductor de su canción
 * principal, que es como se veían todas antes.
 * ============================================================================
 */

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
              /* Hueco de 96px: la variante pequeña basta y sobra. */
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
