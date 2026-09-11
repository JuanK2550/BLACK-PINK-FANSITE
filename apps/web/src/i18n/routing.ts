import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@blackpink/types';

/**
 * ============================================================================
 * ENRUTADO POR IDIOMA
 * ============================================================================
 * Los idiomas y el idioma por defecto salen de `@blackpink/types`, que es la
 * misma lista que valida la API. Declararlos aqui otra vez seria tener dos
 * verdades que acaban divergiendo: el dia que se anada el japones, el frontend
 * lo aceptaria y el backend lo rechazaria con un 400.
 *
 * `localePrefix: 'always'`: TODAS las rutas llevan idioma, incluido el
 * espanol. Sin prefijo en el idioma por defecto, `/discografia` y
 * `/es/discografia` serian la misma pagina en dos URL distintas: contenido
 * duplicado para un buscador y una fuente constante de canonicals mal puestos.
 * ============================================================================
 */
export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: true,
  localeCookie: {
    name: 'NEXT_LOCALE',
    // Un ano: la eleccion de idioma es una preferencia duradera, no una
    // decision de sesion.
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
});

/**
 * Envoltorios de navegacion conscientes del idioma. Se usan EN LUGAR de los
 * de `next/link` y `next/navigation`: mantienen el prefijo de idioma solos,
 * asi que ningun enlace puede sacar al visitante de su idioma por descuido.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
