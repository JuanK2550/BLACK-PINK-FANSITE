import type { ReactNode } from 'react';
import { cn } from './cn';

export type ContainerWidth = 'content' | 'wide' | 'prose';

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  width?: ContainerWidth;
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'main';
}

const WIDTHS: Record<ContainerWidth, string> = {
  content: 'max-w-content',
  wide: 'max-w-wide',
  prose: 'max-w-prose',
};

/**
 * Ancho de lectura y canal lateral unicos del sitio.
 * El canal es fluido (clamp 20px -> 48px) para que a 320px quede aire
 * y a 2560px el contenido no se pegue al borde.
 */
export function Container({ children, className, width = 'content', as = 'div' }: ContainerProps) {
  const Tag = as;
  return <Tag className={cn('px-gutter mx-auto w-full', WIDTHS[width], className)}>{children}</Tag>;
}
