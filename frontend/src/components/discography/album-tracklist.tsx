// Lista de canciones; al pulsar una se abre su reproductor.
'use client';

import { useState } from 'react';
import type { Locale, SoloTrack, Track } from '@blackpink/types';
import { EmbedPlayer, Reveal } from '@blackpink/ui';
import { formatDuration } from '../../lib/format';

export type TracklistItem = Pick<
  Track | SoloTrack,
  'id' | 'title' | 'trackNumber' | 'durationSec' | 'isTitleTrack' | 'spotifyId'
> & {
  localizedTitle?: string | null;
  featuring?: string | null;
};

export interface AlbumTracklistProps {
  tracks: TracklistItem[];
  locale: Locale;
  density?: 'regular' | 'compact';
  openId?: string | null;
  onOpenChange?: (id: string | null) => void;
  labels: {
    titleTrack: string;
    featuring?: string;
    spotifyTitle: string;
    openOnSpotify: string;
    unavailable: string;
    playTrack: string;
    closeTrack: string;
  };
}

export function AlbumTracklist({
  tracks,
  locale,
  labels,
  density = 'regular',
  openId: controlledOpenId,
  onOpenChange,
}: AlbumTracklistProps) {
  const [localOpenId, setLocalOpenId] = useState<string | null>(null);
  const controlled = onOpenChange !== undefined;
  const openId = controlled ? (controlledOpenId ?? null) : localOpenId;
  const setOpenId = controlled ? onOpenChange : setLocalOpenId;

  return (
    <ol className={density === 'compact' ? 'mt-4' : 'mt-block'}>
      {tracks.map((track, index) => {
        const isOpen = openId === track.id;
        const playable = Boolean(track.spotifyId);
        const panelId = `track-player-${track.id}`;
        const displayTitle = track.localizedTitle ?? track.title;

        return (
          <Reveal
            as="li"
            key={track.id}
            delay={Math.min(index, 8) * 0.03}
            className="border-line border-b last:border-b-0"
          >
            <TrackRow
              track={track}
              locale={locale}
              isOpen={isOpen}
              playable={playable}
              panelId={panelId}
              displayTitle={displayTitle}
              density={density}
              featuringText={
                track.featuring && labels.featuring
                  ? labels.featuring.replace('{artists}', track.featuring)
                  : null
              }
              titleTrackLabel={labels.titleTrack}
              toggleLabel={(isOpen ? labels.closeTrack : labels.playTrack).replace(
                '{title}',
                displayTitle,
              )}
              onToggle={() => setOpenId(isOpen ? null : track.id)}
            />

            {isOpen && playable ? (
              <div
                id={panelId}
                className={[
                  'bp-track-player',
                  density === 'compact' ? 'pb-4 pl-10' : 'pb-6 pl-11',
                ].join(' ')}
              >
                <EmbedPlayer
                  title={track.title}
                  spotify={{
                    id: track.spotifyId!,
                    embedUrl: `https://open.spotify.com/embed/track/${track.spotifyId}`,
                    watchUrl: `https://open.spotify.com/track/${track.spotifyId}`,
                  }}
                  labels={{
                    spotifyTitle: labels.spotifyTitle,
                    openOnSpotify: labels.openOnSpotify,
                    unavailable: labels.unavailable,
                  }}
                />
              </div>
            ) : null}
          </Reveal>
        );
      })}
    </ol>
  );
}

function TrackRow({
  track,
  locale,
  isOpen,
  playable,
  panelId,
  displayTitle,
  density,
  featuringText,
  titleTrackLabel,
  toggleLabel,
  onToggle,
}: {
  track: TracklistItem;
  locale: Locale;
  isOpen: boolean;
  playable: boolean;
  panelId: string;
  displayTitle: string;
  density: 'regular' | 'compact';
  featuringText: string | null;
  titleTrackLabel: string;
  toggleLabel: string;
  onToggle: () => void;
}) {
  const body = (
    <>
      <span data-numeric className="text-fg-subtle w-7 shrink-0 text-sm">
        {String(track.trackNumber).padStart(2, '0')}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={[
            'text-fg flex flex-wrap items-baseline gap-x-3',
            density === 'compact' ? 'text-base' : 'text-lg',
          ].join(' ')}
        >
          <span>{displayTitle}</span>
          {track.isTitleTrack ? (
            <span className="text-accent-text text-2xs whitespace-nowrap" data-uppercase>
              {titleTrackLabel}
            </span>
          ) : null}
        </p>
        {track.localizedTitle && track.localizedTitle !== track.title ? (
          <p className="text-fg-subtle mt-0.5 text-xs">{track.title}</p>
        ) : null}
        {featuringText ? <p className="text-fg-subtle mt-0.5 text-xs">{featuringText}</p> : null}
      </div>

      {track.durationSec ? (
        <span data-numeric className="text-fg-muted shrink-0 text-sm">
          {formatDuration(track.durationSec, locale)}
        </span>
      ) : null}
    </>
  );

  const pad = density === 'compact' ? 'py-3.5' : 'py-6';

  if (!playable) {
    return <div className={`flex items-baseline gap-4 opacity-70 ${pad}`}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={panelId}
      aria-label={toggleLabel}
      className={[
        `group/track flex w-full items-baseline gap-4 text-left ${pad}`,
        'focus-visible:outline-focus focus-visible:outline-2 focus-visible:-outline-offset-2',
        'ease-out-soft transition-colors duration-[var(--dur-2)]',
        isOpen ? 'text-accent-text' : 'hover:text-accent-text',
      ].join(' ')}
    >
      {body}
    </button>
  );
}
