import { type DatePrecision, type Locale } from '@blackpink/types';

/**
 * Idioma de reserva cuando falta la traduccion pedida.
 *
 * Es el INGLES, no el espanol (que es el idioma canonico del contenido). Un
 * visitante coreano al que le falta una biografia entiende mucho mas
 * probablemente el ingles que el espanol: el ingles es la lengua franca entre
 * los tres idiomas del sitio, no la lengua del autor.
 */
const FALLBACK_LOCALE: Locale = 'en';

/** Cualquier fila de traduccion tiene, como minimo, su idioma. */
interface HasLocale {
  locale: Locale;
}

/**
 * Elige la traduccion del idioma pedido, con una cadena de reserva explicita:
 *
 *   idioma pedido -> ingles -> la primera que haya
 *
 * La reserva existe porque el contenido se traduce de forma incremental: un
 * album nuevo puede tener ficha en espanol y aun no en coreano. Devolver null
 * en ese caso dejaria un hueco en la interfaz; devolver el ingles deja un
 * texto util mientras llega la traduccion.
 */
export function pickTranslation<T extends HasLocale>(
  translations: T[],
  locale: Locale,
): T | undefined {
  return (
    translations.find((row) => row.locale === locale) ??
    translations.find((row) => row.locale === FALLBACK_LOCALE) ??
    translations[0]
  );
}

/**
 * Devuelve el primer texto no vacio de la lista.
 *
 * Una traduccion puede existir como fila pero tener el campo a null (por
 * ejemplo una descripcion que aun no se ha escrito), asi que no basta con
 * elegir la fila: hay que elegir el campo.
 */
export function firstText(...candidates: (string | null | undefined)[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate;
  }
  return null;
}

/** Formatea una fecha de Postgres (`@db.Date`) como YYYY-MM-DD, sin hora. */
export function toIsoDate(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

/**
 * Estrecha la precision de fecha al tipo del contrato.
 *
 * En la base es una columna de texto con un CHECK que solo admite day, month
 * o year, pero Prisma la tipa como `string` y TypeScript no puede ver esa
 * restriccion. Se valida aqui, en el borde, en lugar de forzar el tipo a
 * ciegas: si algun dia entra un valor raro por otra via, la API devuelve el
 * valor mas conservador en vez de propagar algo que el cliente no sabe leer.
 */
export function toDatePrecision(value: string): DatePrecision {
  return value === 'day' || value === 'month' || value === 'year' ? value : 'day';
}
