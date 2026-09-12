// Reproductor oficial de Spotify incrustado.

import { cn } from '../cn';
import { ArrowRightIcon } from '../icons';

export interface EmbedTargetLike {
  id: string;
  embedUrl: string;
  watchUrl: string;
}

export interface EmbedPlayerProps {
  title: string;
  spotify?: EmbedTargetLike | null;
  labels: {
    spotifyTitle: string;
    openOnSpotify: string;
    unavailable: string;
  };
  className?: string;
}

const COMPACT_HEIGHT = 80;

function withDarkTheme(embedUrl: string): string {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set('theme', '0');
    return url.toString();
  } catch {
    return embedUrl;
  }
}

export function EmbedPlayer({ title, spotify, labels, className }: EmbedPlayerProps) {
  if (!spotify) {
    return (
      <p className={cn('text-fg-subtle border-line border-t pt-4 text-xs', className)}>
        {labels.unavailable}
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <iframe
        src={withDarkTheme(spotify.embedUrl)}
        title={labels.spotifyTitle.replace('{title}', title)}
        height={COMPACT_HEIGHT}
        loading="lazy"
        // Obsoleto, pero es lo único que quita la barra de desplazamiento del reproductor de Spotify.
        scrolling="no"
        allow="encrypted-media; clipboard-write; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        className="border-line block w-full max-w-prose rounded-none border-0 border-t"
        style={{ height: COMPACT_HEIGHT }}
      />

      <ExternalLink href={spotify.watchUrl} label={labels.openOnSpotify} />
    </div>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group/ext text-fg-muted hover:text-accent-text ease-out-soft focus-visible:outline-focus inline-flex w-fit items-center gap-1.5 text-xs transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      {label}
      <ArrowRightIcon className="ease-out-bp -rotate-45 text-xs transition-transform duration-[var(--dur-2)] group-hover/ext:translate-x-0.5" />
    </a>
  );
}
