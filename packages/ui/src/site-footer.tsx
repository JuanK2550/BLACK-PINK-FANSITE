import type { Locale } from '@blackpink/types';
import { cn } from './cn';
import { Container } from './container';
import { DISCLAIMER } from './disclaimer-banner';
import { ArrowRightIcon } from './icons';
import type { FooterColumn, SocialLink } from './nav-types';
import { Wordmark } from './wordmark';

export interface FooterLabels {
  tagline: string;
  officialTitle: string;
  officialNote: string;
  legal: string;
  credit: string;
}

export interface SiteFooterProps {
  locale?: Locale;
  columns: FooterColumn[];
  socials: SocialLink[];
  /** Prefijo de idioma para los enlaces internos. */
  localePrefix?: string;
  labels: FooterLabels;
  className?: string;
}

export function SiteFooter({
  locale = 'es',
  columns,
  socials,
  localePrefix = '',
  labels,
  className,
}: SiteFooterProps) {
  return (
    <footer className={cn('border-line mt-section border-t', className)}>
      <Container width="wide" className="py-block">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:gap-16">
          {/* --- Identidad --- */}
          <div>
            <Wordmark className="text-3xl" />
            <p className="text-fg-muted mt-4 max-w-[38ch] text-sm">{labels.tagline}</p>
          </div>

          {/* --- Enlaces --- */}
          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-fg-subtle text-2xs" data-uppercase>
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={`${localePrefix}${link.href}`}
                        className="text-fg-muted hover:text-accent-text ease-out-soft text-sm transition-colors duration-[var(--dur-2)]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <nav aria-label={labels.officialTitle}>
              <h2 className="text-fg-subtle text-2xs" data-uppercase>
                {labels.officialTitle}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {socials.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="group/ext text-fg-muted hover:text-accent-text ease-out-soft inline-flex items-center gap-1.5 text-sm transition-colors duration-[var(--dur-2)]"
                    >
                      {social.label}
                      <ArrowRightIcon className="ease-out-bp -rotate-45 text-xs transition-transform duration-[var(--dur-2)] group-hover/ext:translate-x-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-fg-subtle mt-4 max-w-[30ch] text-xs">{labels.officialNote}</p>
            </nav>
          </div>
        </div>

        {/* --- Aviso legal. No es letra pequena escondida: es parte del producto. --- */}
        <div className="border-line mt-10 border-t pt-6">
          <p className="text-fg-muted max-w-prose text-xs leading-relaxed">
            <strong className="text-fg font-medium">{DISCLAIMER[locale]}</strong> {labels.legal}
          </p>
          <p className="text-fg-subtle mt-3 text-xs">{labels.credit}</p>
        </div>
      </Container>
    </footer>
  );
}
