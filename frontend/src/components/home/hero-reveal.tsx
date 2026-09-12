// Animación de entrada de la portada.

import type { Locale } from '@blackpink/types';
import { MagneticLink } from '@blackpink/ui';

export interface HeroRevealProps {
  lead: string;
  ctaPrimary: string;
  ctaSecondary: string;
  indexLabel: string;
  scrollHint: string;
  items: { key: string; label: string; href: string }[];
  locale: Locale;
}

export function HeroReveal({
  lead,
  ctaPrimary,
  ctaSecondary,
  indexLabel,
  scrollHint,
  items,
  locale,
}: HeroRevealProps) {
  return (
    <>
      <h1 className="font-display text-hero font-extrabold">
        <span className="bp-hero-in text-fg block">BLACK</span>
        <span className="bp-hero-in text-accent-text block" style={{ animationDelay: '90ms' }}>
          PINK
        </span>
      </h1>

      <div
        className="bp-hero-in mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
        style={{ animationDelay: '180ms' }}
      >
        <p className="text-fg-muted max-w-[46ch] text-pretty text-lg">{lead}</p>

        <div className="flex shrink-0 flex-wrap gap-3 md:pe-28">
          <MagneticLink href={`/${locale}/grupo`} size="lg">
            {ctaPrimary}
          </MagneticLink>
          <MagneticLink href={`/${locale}/discografia`} variant="secondary" size="lg">
            {ctaSecondary}
          </MagneticLink>
        </div>
      </div>

      <nav
        aria-label={indexLabel}
        className="bp-hero-in border-line mt-12 border-t pt-4"
        style={{ animationDelay: '300ms' }}
      >
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {items.map((item) => (
            <li key={item.key}>
              <a
                href={`/${locale}${item.href}`}
                className="text-fg-muted hover:text-accent-text text-2xs ease-out-soft transition-colors duration-[var(--dur-2)]"
                data-uppercase
              >
                {item.label}
              </a>
            </li>
          ))}
          <li className="text-fg-muted text-2xs ml-auto hidden items-center gap-2 sm:flex">
            <span data-uppercase>{scrollHint}</span>
            <span aria-hidden="true" className="bg-line-strong block h-px w-10" />
          </li>
        </ul>
      </nav>
    </>
  );
}
