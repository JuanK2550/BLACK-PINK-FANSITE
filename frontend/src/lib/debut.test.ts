// Pruebas del cálculo del debut.

import { describe, expect, it } from 'vitest';
import { daysSince, msUntilNextUtcMidnight, yearsSince } from './debut';

const DEBUT = '2016-08-08';
const utc = (iso: string) => Date.parse(iso);

describe('daysSince', () => {
  it('el propio dia del debut cuenta cero', () => {
    expect(daysSince(DEBUT, utc('2016-08-08T00:00:00Z'))).toBe(0);
    expect(daysSince(DEBUT, utc('2016-08-08T23:59:59Z'))).toBe(0);
  });

  it('cambia a medianoche UTC y no antes', () => {
    expect(daysSince(DEBUT, utc('2016-08-08T23:59:59Z'))).toBe(0);
    expect(daysSince(DEBUT, utc('2016-08-09T00:00:00Z'))).toBe(1);
  });

  it('cuenta los anos bisiestos sin saltarse un dia', () => {
    expect(daysSince('2016-01-01', utc('2020-01-01T12:00:00Z'))).toBe(1461);
  });

  it('nunca devuelve negativo antes del debut', () => {
    expect(daysSince(DEBUT, utc('2015-01-01T00:00:00Z'))).toBe(0);
  });

  it('devuelve cero con una fecha ilegible en vez de NaN', () => {
    expect(daysSince('no es una fecha', utc('2026-01-01T00:00:00Z'))).toBe(0);
  });
});

describe('yearsSince', () => {
  it('no cumple anos hasta el dia del aniversario', () => {
    expect(yearsSince(DEBUT, utc('2017-08-07T23:00:00Z'))).toBe(0);
    expect(yearsSince(DEBUT, utc('2017-08-08T00:00:00Z'))).toBe(1);
  });

  it('no divide por 365,25', () => {
    expect(yearsSince('2016-02-29', utc('2020-02-28T23:00:00Z'))).toBe(3);
    expect(yearsSince('2016-02-29', utc('2020-02-29T00:00:00Z'))).toBe(4);
  });

  it('nunca devuelve negativo', () => {
    expect(yearsSince(DEBUT, utc('2010-01-01T00:00:00Z'))).toBe(0);
  });
});

describe('msUntilNextUtcMidnight', () => {
  it('a medianoche faltan veinticuatro horas, no cero', () => {
    expect(msUntilNextUtcMidnight(utc('2026-01-01T00:00:00Z'))).toBe(86_400_000);
  });

  it('a mediodia falta media jornada', () => {
    expect(msUntilNextUtcMidnight(utc('2026-01-01T12:00:00Z'))).toBe(43_200_000);
  });
});
