import type { ReactNode } from 'react';

export interface PageTransitionProps {
  children: ReactNode;
}

/**
 * ============================================================================
 * TRANSICION DE PAGINA
 * ============================================================================
 * Se monta desde `app/template.tsx`, que React vuelve a montar en cada
 * navegacion —a diferencia de `layout.tsx`, que persiste y por eso la cabecera
 * no parpadea—. Ese remontaje es lo que reinicia la animacion CSS sin que haga
 * falta nada mas.
 *
 * ESTO ERA FRAMER MOTION Y SE CAMBIO DESPUES DE MIRAR EL HTML SERVIDO.
 * Con Framer, el envoltorio salia del servidor como
 * `<div style="opacity:0;transform:translateY(8px)">`, asi que **la pagina
 * entera estaba invisible hasta que el paquete descargaba e hidrataba**. Dos
 * consecuencias, y ninguna es teorica:
 *
 *   1. El LCP no podia ser mejor que el tiempo de hidratacion, pasara lo que
 *      pasara con el HTML. Medido en la portada: 5.104 ms de Render Delay
 *      sobre un TTFB de 519 ms.
 *   2. Sin JavaScript —o con el paquete fallando— el sitio se veia EN BLANCO.
 *      Un aviso legal que no se pinta no cumple su funcion.
 *
 * Con CSS el navegador pinta en cuanto tiene el HTML: `animation-fill-mode`
 * aplica el primer fotograma en la primera pintura y la animacion corre desde
 * ahi, sin esperar a nadie. De paso este fichero deja de necesitar
 * `use client`, asi que Framer Motion sale del arbol de TODAS las paginas.
 *
 * Sigue sin haber animacion de SALIDA, a proposito: obligaria a esperar antes
 * de ver la pagina nueva, y en una navegacion el usuario ya ha decidido.
 * ============================================================================
 */
export function PageTransition({ children }: PageTransitionProps) {
  return <div className="bp-page-in">{children}</div>;
}
