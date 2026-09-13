// Pruebas de la normalización del término de búsqueda.

import { describe, expect, it } from 'vitest';
import { foldColumn, foldSearchTerm, likePattern } from './search-terms';

describe('foldSearchTerm', () => {
  it('quita tildes y mayúsculas', () => {
    expect(foldSearchTerm(' ROSÉ ')).toBe('rose');
    expect(foldSearchTerm('debutó')).toBe('debuto');
    expect(foldSearchTerm('Japón')).toBe('japon');
  });

  it('el hangul sale intacto', () => {
    expect(foldSearchTerm('로제')).toBe('로제');
    expect(foldSearchTerm('블랙핑크')).toBe('블랙핑크');
  });
});

describe('likePattern', () => {
  it('busca el término en cualquier parte', () => {
    expect(likePattern('Born Pink')).toBe('%born pink%');
  });

  it('escapa los comodines de LIKE que escribe el visitante', () => {
    expect(likePattern('100%_\\')).toBe('%100\\%\\_\\\\%');
  });
});

describe('foldColumn', () => {
  it('normaliza la columna igual que el término, y sin romper con NULL', () => {
    const sql = foldColumn('m."stageName"');
    expect(sql).toContain('coalesce(m."stageName", \'\')');
    expect(sql.startsWith('lower(translate(')).toBe(true);
  });

  it('las dos listas de translate tienen la misma longitud', () => {
    const [, from, to] = foldColumn('x').match(/'([^']+)', '([^']+)'/) ?? [];
    expect(from?.length).toBe(to?.length);
  });
});
