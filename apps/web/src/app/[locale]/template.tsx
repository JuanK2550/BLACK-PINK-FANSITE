import { PageTransition } from '@blackpink/ui';

/**
 * template.tsx, no layout.tsx: React vuelve a montar la plantilla en cada
 * navegacion, que es justo lo que necesita una transicion de pagina.
 * layout.tsx persiste entre rutas y por eso el header no parpadea.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
