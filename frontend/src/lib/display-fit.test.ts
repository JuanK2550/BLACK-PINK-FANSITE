// Pruebas del ajuste de titulares.

import { describe, expect, it } from 'vitest';
import { longestWordEm } from './display-fit';

describe('longestWordEm', () => {
  it('manda la palabra más larga en ANCHO, no en letras', () => {
    expect(longestWordEm('SQUARE UP')).toBeCloseTo(7.03, 1);
    expect(longestWordEm('BLACKPINK IN YOUR AREA')).toBeCloseTo(9.63, 1);
  });

  it('una W no mide lo mismo que una I', () => {
    expect(longestWordEm('W')).toBeGreaterThan(longestWordEm('I') * 4);
  });

  it('lo que no está medido cuenta como ancho: pasarse encoge, quedarse corto desborda', () => {
    expect(longestWordEm('뛰어')).toBeCloseTo(2.6, 1);
    expect(longestWordEm('ROSÉ')).toBeGreaterThan(longestWordEm('ROSE'));
  });
});
