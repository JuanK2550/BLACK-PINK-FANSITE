// Marco para imágenes con relleno mientras cargan.

import type { ReactNode } from 'react';
import { cn } from '../cn';
import { ImageIcon } from '../icons';

export type MediaRatio = 'portrait' | 'square' | 'wide' | 'cover';

const RATIOS: Record<MediaRatio, string> = {
  portrait: 'aspect-[3/4]',
  square: 'aspect-square',
  wide: 'aspect-[16/9]',
  cover: 'aspect-[4/5]',
};

export interface MediaFrameProps {
  ratio?: MediaRatio;
  glyph?: string;
  label?: string;
  zoom?: boolean;
  children?: ReactNode;
  className?: string;
}

export function MediaFrame({
  ratio = 'portrait',
  glyph,
  label,
  zoom = false,
  children,
  className,
}: MediaFrameProps) {
  return (
    <div
      className={cn(
        '@container bg-surface shadow-hairline relative isolate overflow-hidden',
        RATIOS[ratio],
        className,
      )}
    >
      <div
        className={cn(
          'absolute inset-0',
          zoom && 'ease-out-bp transition-transform duration-[280ms] group-hover/card:scale-[1.04]',
        )}
      >
        {children ?? (
          <div
            className="grid h-full w-full place-items-center"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, var(--color-accent-tint) 0 1px, transparent 1px 9px)',
            }}
          >
            {glyph ? (
              <span
                aria-hidden="true"
                className="font-display text-fg/8 select-none text-[26cqw] font-extrabold leading-none"
              >
                {glyph}
              </span>
            ) : null}
            {label ? (
              <span className="text-fg-subtle text-2xs absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                <ImageIcon className="text-sm" />
                <span data-uppercase>{label}</span>
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
