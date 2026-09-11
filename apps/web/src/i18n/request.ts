import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

/**
 * Carga los mensajes del idioma pedido en cada peticion.
 *
 * Si el segmento no es un idioma soportado se cae al de por defecto en lugar
 * de lanzar: la URL puede venir de un enlace roto o de un rastreador, y una
 * pagina en espanol es mejor respuesta que un error.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    /*
     * Zona horaria fija para el formateo de fechas.
     *
     * Sin esto, el servidor formatea con SU zona y el navegador con la del
     * visitante, y React avisa de que el HTML servido no coincide con el
     * cliente. Las fechas de este sitio son dias de calendario (un
     * lanzamiento, un concierto), no instantes: no dependen de donde este
     * quien las lee.
     */
    timeZone: 'UTC',
  };
});
