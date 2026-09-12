// Formato de fechas, números y duraciones por idioma.

import type { DatePrecision, Locale } from '@blackpink/types';

const INTL_LOCALES: Record<Locale, string> = {
  es: 'es-ES',
  en: 'en-US',
  ko: 'ko-KR',
};

export function formatDate(date: string, locale: Locale, precision: DatePrecision = 'day'): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  if (Number.isNaN(value.getTime())) return date;

  // UTC fija: son días de calendario, y así el HTML del servidor coincide con el del navegador.
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

export function formatYear(date: string, locale: Locale): string {
  return formatDate(date, locale, 'year');
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale]).format(value);
}

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
