import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration, formatNumber, formatYear } from './format';

/**
 * El formateo por idioma.
 *
 * Lo que se prueba aqui no es que `Intl` funcione, sino las DECISIONES del
 * proyecto: que la precision se respete, que la zona sea UTC siempre y que un
 * dato ilegible no se convierta en «Invalid Date» dentro de la pagina.
 */

describe('formatDate', () => {
  it('respeta la precision del dato', () => {
    // Un hito con precision de mes lleva el dia 1 como relleno; mostrarlo
    // seria inventar una exactitud que el dato no tiene.
    expect(formatDate('2016-08-08', 'es', 'day')).toContain('8');
    expect(formatDate('2016-08-01', 'es', 'month')).not.toMatch(/\b1\b/);
    expect(formatDate('2016-08-01', 'es', 'year')).toBe('2016');
  });

  it('fija UTC: la fecha no se desplaza un dia', () => {
    // Sin `timeZone: 'UTC'`, en un huso al oeste esto se pintaria como el 7.
    expect(formatDate('2016-08-08', 'en', 'day')).toContain('8');
    expect(formatDate('2016-01-01', 'en', 'day')).toContain('2016');
  });

  it('cambia el orden en coreano', () => {
    expect(formatDate('2016-08-08', 'ko', 'day')).toMatch(/2016.*8.*8/);
  });

  it('devuelve la cadena tal cual si no es una fecha', () => {
    expect(formatDate('vete a saber', 'es')).toBe('vete a saber');
  });
});

describe('formatYear', () => {
  it('da solo el ano', () => {
    expect(formatYear('2022-09-16', 'es')).toBe('2022');
  });
});

describe('formatNumber', () => {
  it('usa el separador de millares de cada idioma', () => {
    // Un separador equivocado convierte 1.234 canciones en 1 coma 234.
    expect(formatNumber(1234, 'es')).toBe('1234');
    expect(formatNumber(12345, 'es')).toBe('12.345');
    expect(formatNumber(12345, 'en')).toBe('12,345');
  });
});

describe('formatDuration', () => {
  it('rellena los segundos con cero', () => {
    expect(formatDuration(242, 'es')).toBe('4:02');
  });

  it('cero segundos no es cadena vacia', () => {
    expect(formatDuration(0, 'en')).toBe('0:00');
  });
});
