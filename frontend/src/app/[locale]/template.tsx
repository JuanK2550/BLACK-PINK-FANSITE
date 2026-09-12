// Transición de entrada al cambiar de página.

import { PageTransition } from '@blackpink/ui';

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
