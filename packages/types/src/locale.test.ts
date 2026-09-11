import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, isLocale, SUPPORTED_LOCALES } from './locale';

describe('locale', () => {
  it('soporta espanol, ingles y coreano', () => {
    expect(SUPPORTED_LOCALES).toEqual(['es', 'en', 'ko']);
  });

  it('usa espanol como idioma por defecto', () => {
    expect(isLocale(DEFAULT_LOCALE)).toBe(true);
  });

  it('rechaza idiomas no soportados', () => {
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
