// Pruebas de las variantes del término de búsqueda.

import { describe, expect, it } from 'vitest';
import { searchVariants } from './search-terms';

describe('searchVariants', () => {
  it('añade la versión sin tildes', () => {
    expect(searchVariants(' Rosé ')).toEqual(['Rosé', 'Rose']);
    expect(searchVariants('debutó')).toEqual(['debutó', 'debuto']);
  });

  it('sin tildes no duplica el término', () => {
    expect(searchVariants('born pink')).toEqual(['born pink']);
  });

  it('el hangul sale intacto', () => {
    expect(searchVariants('로제')).toEqual(['로제']);
    expect(searchVariants('블랙핑크')).toEqual(['블랙핑크']);
  });
});
