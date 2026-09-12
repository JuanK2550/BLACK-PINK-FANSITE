// Estados vacío y de error.

import type { ReactNode } from 'react';
import { buttonStyles } from '../controls/button';
import { cn } from '../cn';
import { ArrowRightIcon } from '../icons';

export interface StateMessageProps {
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  secondary?: { label: string; href: string };
  detail?: { label: string; value: string };
  children?: ReactNode;
  className?: string;
}

export function StateMessage({
  title,
  description,
  action,
  secondary,
  detail,
  children,
  className,
}: StateMessageProps) {
  return (
    <div className={cn('border-line border-t pt-8', className)}>
      <h2 className="font-display text-fg text-balance text-3xl font-extrabold">{title}</h2>
      <p className="text-fg-muted mt-3 max-w-prose text-pretty text-base">{description}</p>

      {children}

      {(action ?? secondary) ? (
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          {action?.href ? (
            <a href={action.href} className={buttonStyles({ size: 'md' })}>
              {action.label}
            </a>
          ) : action?.onClick ? (
            <button type="button" onClick={action.onClick} className={buttonStyles({ size: 'md' })}>
              {action.label}
            </button>
          ) : null}

          {secondary ? (
            <a
              href={secondary.href}
              className="group/link text-fg-muted hover:text-accent-text ease-out-soft focus-visible:outline-focus inline-flex items-center gap-2 text-sm transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {secondary.label}
              <ArrowRightIcon className="ease-out-bp transition-transform duration-[var(--dur-2)] group-hover/link:translate-x-1" />
            </a>
          ) : null}
        </div>
      ) : null}

      {detail ? (
        <details className="group/detail mt-8">
          <summary className="text-fg-subtle hover:text-fg-muted focus-visible:outline-focus text-2xs ease-out-soft w-fit cursor-pointer list-none transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-4">
            <span data-uppercase>{detail.label}</span>
          </summary>
          <p className="text-fg-subtle border-line mt-3 break-words border-l pl-4 font-mono text-xs">
            {detail.value}
          </p>
        </details>
      ) : null}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('border-line border-t py-12', className)}>
      <p className="font-display text-fg text-xl font-bold">{title}</p>
      <p className="text-fg-muted mt-2 max-w-prose text-pretty text-sm">{description}</p>
    </div>
  );
}
