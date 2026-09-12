// Elige la traducción pedida, con el inglés como reserva.

import { type DatePrecision, type Locale } from '@blackpink/types';

const FALLBACK_LOCALE: Locale = 'en';

interface HasLocale {
  locale: Locale;
}

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

export function firstText(...candidates: (string | null | undefined)[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate;
  }
  return null;
}

export function toIsoDate(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function toDatePrecision(value: string): DatePrecision {
  return value === 'day' || value === 'month' || value === 'year' ? value : 'day';
}
