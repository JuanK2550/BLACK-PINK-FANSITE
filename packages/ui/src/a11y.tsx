import type { ReactNode } from 'react';
import { cn } from './cn';

export interface VisuallyHiddenProps {
  children: ReactNode;
  className?: string;
}

/**
 * Oculta a la vista pero lo deja disponible para lectores de pantalla.
 * No usa display:none ni visibility:hidden, que si lo ocultarian.
 */
export function VisuallyHidden({ children, className }: VisuallyHiddenProps) {
  return <span className={cn('sr-only', className)}>{children}</span>;
}

export interface SkipLinkProps {
  href?: string;
  children: ReactNode;
}

/**
 * Primer elemento enfocable de la pagina. Invisible hasta que recibe foco,
 * y entonces salta por encima de todo el header y el mega-menu.
 */
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
