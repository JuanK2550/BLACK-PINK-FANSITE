// Utilidades de accesibilidad (texto solo para lectores de pantalla).

import type { ReactNode } from 'react';
import { cn } from './cn';

export interface VisuallyHiddenProps {
  children: ReactNode;
  className?: string;
}

export function VisuallyHidden({ children, className }: VisuallyHiddenProps) {
  return <span className={cn('sr-only', className)}>{children}</span>;
}

export interface SkipLinkProps {
  href?: string;
  children: ReactNode;
}

export function SkipLink({ href = '#contenido', children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'bg-accent text-accent-fg sr-only rounded-full px-5 py-2.5 text-sm font-medium',
        'focus:z-100 focus:not-sr-only focus:fixed focus:left-4 focus:top-4',
      )}
    >
      {children}
    </a>
  );
}
