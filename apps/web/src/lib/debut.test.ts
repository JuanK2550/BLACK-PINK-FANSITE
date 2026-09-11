import { describe, expect, it } from 'vitest';
import { daysSince, msUntilNextUtcMidnight, yearsSince } from './debut';

/**
 * La aritmética del contador de `/grupo`.
 *
 * Se prueba con instantes fijos y no con `Date.now()`: un test que depende del
 * reloj de quien lo ejecuta pasa hoy y falla el 29 de febrero.
 */

const DEBUT = '2016-08-08';
const utc = (iso: string) => Date.parse(iso);

describe('daysSince', () => {
  it('el propio dia del debut cuenta cero', () => {
    // Ese dia el grupo llevaba cero dias publicando, no uno.
    expect(daysSince(DEBUT, utc('2016-08-08T00:00:00Z'))).toBe(0);
    expect(daysSince(DEBUT, utc('2016-08-08T23:59:59Z'))).toBe(0);
  });

  it('cambia a medianoche UTC y no antes', () => {
    expect(daysSince(DEBUT, utc('2016-08-08T23:59:59Z'))).toBe(0);
    expect(daysSince(DEBUT, utc('2016-08-09T00:00:00Z'))).toBe(1);
  });

  it('cuenta los anos bisiestos sin saltarse un dia', () => {
    // 2016 y 2020 son bisiestos: entre los dos hay 1461 dias, no 1460.
    expect(daysSince('2016-01-01', utc('2020-01-01T12:00:00Z'))).toBe(1461);
  });

  it('nunca devuelve negativo antes del debut', () => {
    expect(daysSince(DEBUT, utc('2015-01-01T00:00:00Z'))).toBe(0);
  });

  it('devuelve cero con una fecha ilegible en vez de NaN', () => {
    // Un NaN acabaria pintado en la pagina como «NaN dias».
    expect(daysSince('no es una fecha', utc('2026-01-01T00:00:00Z'))).toBe(0);
  });
});

describe('yearsSince', () => {
  it('no cumple anos hasta el dia del aniversario', () => {
    expect(yearsSince(DEBUT, utc('2017-08-07T23:00:00Z'))).toBe(0);
    expect(yearsSince(DEBUT, utc('2017-08-08T00:00:00Z'))).toBe(1);
  });

  it('no divide por 365,25', () => {
    // Dividir adelanta el aniversario unas horas cada cuatro anos. Aqui se
    // comparan mes y dia, que es como lo cuenta una persona.
    expect(yearsSince('2016-02-29', utc('2020-02-28T23:00:00Z'))).toBe(3);
    expect(yearsSince('2016-02-29', utc('2020-02-29T00:00:00Z'))).toBe(4);
  });

  it('nunca devuelve negativo', () => {
    expect(yearsSince(DEBUT, utc('2010-01-01T00:00:00Z'))).toBe(0);
  });
});

describe('msUntilNextUtcMidnight', () => {
  it('a medianoche faltan veinticuatro horas, no cero', () => {
    // Devolver cero programaria un temporizador inmediato y entraria en bucle.
    expect(msUntilNextUtcMidnight(utc('2026-01-01T00:00:00Z'))).toBe(86_400_000);
  });

  it('a mediodia falta media jornada', () => {
    expect(msUntilNextUtcMidnight(utc('2026-01-01T12:00:00Z'))).toBe(43_200_000);
  });
});
