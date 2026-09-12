// Idiomas del sitio.

export const SUPPORTED_LOCALES = ['es', 'en', 'ko'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export type Translated<T = string> = Record<Locale, T>;
