import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * ============================================================================
 * DETECCION DE IDIOMA
 * ============================================================================
 * Orden de decision, de mas a menos prioritario:
 *
 *   1. El prefijo de la URL. Si alguien comparte /ko/discografia, quien abra
 *      ese enlace ve coreano, tenga la cookie que tenga: el enlace manda.
 *   2. La cookie NEXT_LOCALE, escrita cuando el visitante elige idioma a mano.
 *   3. La cabecera Accept-Language del navegador.
 *   4. El idioma por defecto.
 *
 * La cookie va por delante del navegador a proposito: una eleccion explicita
 * pesa mas que una preferencia del sistema. Y la URL va por delante de todo,
 * o compartir un enlace en un idioma concreto dejaria de funcionar.
 * ============================================================================
 */
export default createMiddleware(routing);

export const config = {
  /*
   * Se excluyen las rutas internas de Next, los archivos estaticos y
   * cualquier cosa con extension. Sin esto, el middleware intentaria
   * redirigir /favicon.ico a /es/favicon.ico y el icono dejaria de cargar.
   */
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
