// Transición entre páginas.

import type { ReactNode } from 'react';

export interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return <div className="bp-page-in">{children}</div>;
}
