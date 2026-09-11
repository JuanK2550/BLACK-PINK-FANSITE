import { notFound } from 'next/navigation';

/**
 * ============================================================================
 * CUALQUIER RUTA QUE NO EXISTE, DENTRO DEL LAYOUT
 * ============================================================================
 * Sin este fichero, una URL que no casa con ninguna ruta —`/es/galeria` antes
 * de que existiera la galería, o una errata cualquiera— NO llega a
 * `[locale]/not-found.tsx`. Next sirve su propio 404, fuera del layout: fondo
 * negro, «This page could not be found», en inglés, sin cabecera, sin forma de
 * volver y **sin el aviso de sitio no oficial**, que la regla 5 del proyecto
 * exige en todas las páginas. Es exactamente la pantalla que se vio en
 * `/es/galeria`.
 *
 * `[locale]/not-found.tsx` solo se usa cuando alguien llama a `notFound()`
 * DENTRO del segmento. Este comodín lo llama para todo lo que sobra, y así el
 * 404 hereda el layout entero: cabecera, aviso, idioma y PINKY.
 *
 * Los segmentos estáticos y dinámicos concretos ganan siempre a un comodín,
 * así que esto no puede tapar ninguna página real. Lo comprueba el e2e de
 * navegación, que recorre todas las secciones y además pide una que no existe.
 * ============================================================================
 */
export default function RutaInexistente() {
  notFound();
}
