import type { DatePrecision, Locale } from '@blackpink/types';

/**
 * ============================================================================
 * FORMATEO POR IDIOMA
 * ============================================================================
 * Fechas, números y duraciones con `Intl`, no con plantillas a mano.
 *
 * Las diferencias no son cosméticas:
 *
 *   es  8 de agosto de 2016   ·  1.234
 *   en  August 8, 2016        ·  1,234
 *   ko  2016년 8월 8일          ·  1,234
 *
 * El coreano invierte el orden y añade sufijos de unidad; el español y el
 * inglés intercambian el punto y la coma de millares. Escribir "8/8/2016" a
 * mano sería legible solo para una parte de los visitantes, y un separador
 * equivocado convierte 1.234 canciones en 1 coma 234.
 *
 * `timeZone: 'UTC'` en todas: son días de calendario, no instantes. Sin
 * fijarla, la misma fecha se pinta distinta según dónde esté el visitante y
 * el HTML del servidor deja de coincidir con el del navegador.
 * ============================================================================
 */

const INTL_LOCALES: Record<Locale, string> = {
  es: 'es-ES',
  en: 'en-US',
  ko: 'ko-KR',
};

/**
 * Formatea una fecha respetando su PRECISIÓN REAL.
 *
 * Un hito con precisión de mes lleva el día 1 como relleno; mostrarlo sería
 * inventar una exactitud que el dato no tiene. Con `year`, solo el año.
 */
export function formatDate(date: string, locale: Locale, precision: DatePrecision = 'day'): string {
  // Se construye a mediodía UTC para que ningún desfase de zona horaria
  // desplace la fecha un día hacia atrás al formatear.
  const value = new Date(`${date}T12:00:00.000Z`);
  if (Number.isNaN(value.getTime())) return date;

  const options: Intl.DateTimeFormatOptions = { timeZone: 'UTC' };

  if (precision === 'year') {
    options.year = 'numeric';
  } else if (precision === 'month') {
    options.year = 'numeric';
    options.month = 'long';
  } else {
    options.year = 'numeric';
    options.month = 'long';
    options.day = 'numeric';
  }

  return new Intl.DateTimeFormat(INTL_LOCALES[locale], options).format(value);
}

/** Solo el año. Para ejes de cronología y fichas compactas. */
export function formatYear(date: string, locale: Locale): string {
  return formatDate(date, locale, 'year');
}

/** Números con el separador de millares del idioma. */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale]).format(value);
}

/**
 * Duración de una canción.
 *
 * En occidente se lee `3:42`; en coreano lo natural es `3분 42초`.
 * `Intl.DurationFormat` aún no está en todos los navegadores, así que se
 * comprueba antes de usarlo y se cae al formato universal si no existe.
 */
export function formatDuration(seconds: number, locale: Locale): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  const DurationFormat = (
    Intl as unknown as {
      DurationFormat?: new (
        locales: string,
        options: Record<string, unknown>,
      ) => { format: (value: Record<string, number>) => string };
    }
  ).DurationFormat;

  if (locale === 'ko' && DurationFormat) {
    return new DurationFormat(INTL_LOCALES.ko, { style: 'narrow' }).format({
      minutes,
      seconds: rest,
    });
  }

  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
