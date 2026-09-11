/**
 * ============================================================================
 * IMAGENES PROPIAS DEL SITIO
 * ============================================================================
 * Regla del proyecto: no se aloja material con copyright. Todas las imagenes
 * son placeholders o material de licencia libre que sube el propietario.
 *
 * COMO PONER TU PROPIA PORTADA:
 *   1. Deja el archivo en apps/web/public/hero/  (por ejemplo portada.jpg).
 *   2. Cambia HERO_IMAGE de null al objeto de abajo.
 * No hay que tocar nada mas: el encuadre, el recorte y el degradado de
 * legibilidad ya estan resueltos en el componente del hero, y el titular
 * mantiene el contraste AA sobre la imagen porque el degradado se calcula
 * sobre el color de fondo del tema activo.
 *
 * Ejemplo:
 *   export const HERO_IMAGE: HeroImage | null = {
 *     src: '/hero/portada.jpg',
 *     alt: 'Fotografia de portada del sitio',
 *     position: 'center 30%',
 *   };
 * ============================================================================
 */

export interface HeroImage {
  src: string;
  /** Texto alternativo. Obligatorio: describe la imagen, no la decora. */
  alt: string;
  /** object-position del recorte. Por defecto el centro. */
  position?: string;
}

export const HERO_IMAGE: HeroImage | null = null;
