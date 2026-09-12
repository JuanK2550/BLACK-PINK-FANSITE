// Portada de un disco enlazada desde Spotify.

import Image from 'next/image';
import { MediaFrame, type MediaRatio } from '@blackpink/ui';

export interface AlbumCoverProps {
  cover: {
    coverUrl: string | null;
    coverWidth: number | null;
    coverHeight: number | null;
    coverThumbUrl?: string | null;
    coverThumbWidth?: number | null;
    coverThumbHeight?: number | null;
  };
  title: string;
  alt: string;
  variant?: 'full' | 'thumb';
  glyph?: string;
  ratio?: MediaRatio;
  zoom?: boolean;
  sizes: string;
  priority?: boolean;
  className?: string;
}

export function AlbumCover({
  cover,
  title,
  alt,
  variant = 'full',
  glyph,
  ratio = 'square',
  zoom = false,
  sizes,
  priority = false,
  className,
}: AlbumCoverProps) {
  const useThumb = variant === 'thumb' && Boolean(cover.coverThumbUrl);

  const coverUrl = useThumb ? cover.coverThumbUrl : cover.coverUrl;
  const coverWidth = useThumb ? cover.coverThumbWidth : cover.coverWidth;
  const coverHeight = useThumb ? cover.coverThumbHeight : cover.coverHeight;

  if (!coverUrl || !coverWidth || !coverHeight) {
    return (
      <MediaFrame ratio={ratio} glyph={glyph} label={title} zoom={zoom} className={className} />
    );
  }

  return (
    <MediaFrame ratio={ratio} zoom={zoom} className={className}>
      <Image
        src={coverUrl}
        width={coverWidth}
        height={coverHeight}
        sizes={sizes}
        priority={priority}
        // Sin optimizar: la portada es de Spotify y no se puede reescalar ni servir desde aquí.
        unoptimized
        alt={alt}
        className="h-full w-full object-cover"
      />
    </MediaFrame>
  );
}
