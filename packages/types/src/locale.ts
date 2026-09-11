/** Idiomas soportados por el sitio. El orden define el fallback. */
export const SUPPORTED_LOCALES = ['es', 'en', 'ko'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Texto traducido a los tres idiomas. Base de todo el contenido del sitio. */
export type Translated<T = string> = Record<Locale, T>;
