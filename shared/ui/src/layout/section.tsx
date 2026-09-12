// Sección de página con su título.

import type { ReactNode } from 'react';
import { cn } from '../cn';
import { Container } from './container';
import { ArrowRightIcon } from '../icons';

export interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  width?: 'content' | 'wide';
  ariaLabel?: string;
}

export function Section({ id, children, className, width = 'wide', ariaLabel }: SectionProps) {
  return (
    <section id={id} aria-label={ariaLabel} className={cn('py-section', className)}>
      <Container width={width}>{children}</Container>
    </section>
  );
}

export interface SectionHeadingProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  badge?: string;
  hideRule?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  description,
  actionLabel,
  actionHref,
  badge,
  hideRule = false,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(!hideRule && 'border-line border-t', 'pt-6', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h2 className="font-display text-fg text-balance text-4xl font-extrabold">{title}</h2>
          {description ? (
            <p className="text-fg-muted mt-3 max-w-prose text-pretty text-base">{description}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {badge ? <Badge>{badge}</Badge> : null}
          {actionLabel && actionHref ? (
            <a
              href={actionHref}
              className="group/link text-accent-text focus-visible:outline-focus inline-flex items-center gap-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {actionLabel}
              <ArrowRightIcon className="ease-out-bp transition-transform duration-[var(--dur-2)] group-hover/link:translate-x-1" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      data-uppercase
      className={cn('text-fg-subtle text-2xs inline-flex items-center gap-1.5', className)}
    >
      <span className="bg-accent h-1 w-1 rounded-full" />
      {children}
    </span>
  );
}
