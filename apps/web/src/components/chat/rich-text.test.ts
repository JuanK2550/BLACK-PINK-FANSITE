import { describe, expect, it } from 'vitest';
import { parseRichText } from './rich-text';

/**
 * El analizador es una funcion pura y por eso se prueba aparte del componente:
 * lo que puede romperse aqui son los limites de las marcas, no el JSX.
 */

const flat = (text: string, streaming = false) =>
  parseRichText(text, streaming).map((b) => ({ ...b, spans: b.spans }));

describe('parseRichText', () => {
  it('deja el texto plano en un solo tramo', () => {
    expect(flat('Hola, soy PINKY.')).toEqual([
      { type: 'p', spans: [{ text: 'Hola, soy PINKY.' }] },
    ]);
  });

  it('pone en cursiva los titulos que el modelo marca con un asterisco', () => {
    // El caso real: la respuesta llegaba con los asteriscos a la vista.
    expect(flat('los albumes *THE ALBUM* (2020) y *BORN PINK* (2022)')).toEqual([
      {
        type: 'p',
        spans: [
          { text: 'los albumes ' },
          { text: 'THE ALBUM', em: true },
          { text: ' (2020) y ' },
          { text: 'BORN PINK', em: true },
          { text: ' (2022)' },
        ],
      },
    ]);
  });

  it('distingue negrita de cursiva y las anida', () => {
    expect(flat('**muy *muy* importante**')).toEqual([
      {
        type: 'p',
        spans: [
          { text: 'muy ', strong: true },
          { text: 'muy', strong: true, em: true },
          { text: ' importante', strong: true },
        ],
      },
    ]);
  });

  it('no toca un asterisco sin pareja cuando la respuesta ya termino', () => {
    expect(flat('un 5 * 3 y ya')).toEqual([{ type: 'p', spans: [{ text: 'un 5 * 3 y ya' }] }]);
  });

  it('no parte una palabra con guion bajo', () => {
    // `snake_case` es un nombre, no una cursiva a medias.
    expect(flat('la clave es INTERNAL_API_KEY hoy')).toEqual([
      { type: 'p', spans: [{ text: 'la clave es INTERNAL_API_KEY hoy' }] },
    ]);
  });

  describe('mientras el texto sigue llegando', () => {
    it('abre la marca aunque el cierre no haya llegado', () => {
      // Sin esto se veria «*THE ALBU» con el asterisco, y al llegar el cierre
      // el texto saltaria de golpe a cursiva.
      expect(flat('los albumes *THE ALBU', true)).toEqual([
        { type: 'p', spans: [{ text: 'los albumes ' }, { text: 'THE ALBU', em: true }] },
      ]);
    });

    it('y al terminar el stream la misma marca suelta vuelve a ser un asterisco', () => {
      expect(flat('los albumes *THE ALBU', false)).toEqual([
        { type: 'p', spans: [{ text: 'los albumes *THE ALBU' }] },
      ]);
    });
  });

  describe('listas', () => {
    it('reconoce vinetas y les quita la marca', () => {
      expect(flat('- THE ALBUM\n- BORN PINK')).toEqual([
        { type: 'li', spans: [{ text: 'THE ALBUM' }] },
        { type: 'li', spans: [{ text: 'BORN PINK' }] },
      ]);
    });

    it('conserva la numeracion en lugar de renumerar', () => {
      expect(flat('2. BORN PINK')).toEqual([
        { type: 'li', marker: '2.', spans: [{ text: 'BORN PINK' }] },
      ]);
    });

    it('no confunde un año con una lista numerada', () => {
      expect(flat('2024. Fue el año de las giras')).toEqual([
        { type: 'p', spans: [{ text: '2024. Fue el año de las giras' }] },
      ]);
    });

    it('no confunde negrita al principio de linea con una vineta', () => {
      expect(flat('**BORN PINK** salio en 2022')).toEqual([
        { type: 'p', spans: [{ text: 'BORN PINK', strong: true }, { text: ' salio en 2022' }] },
      ]);
    });
  });

  it('tira la URL de un enlace y se queda con la etiqueta', () => {
    // Regla de la Fase 9: una direccion que propone el modelo no se convierte
    // en algo pulsable. La navegacion va por la accion validada contra el mapa.
    expect(flat('mira la [discografia](https://example.com/falsa) del sitio')).toEqual([
      { type: 'p', spans: [{ text: 'mira la discografia del sitio' }] },
    ]);
  });

  it('convierte un titular en negrita, no en un titular', () => {
    expect(flat('## Discografia')).toEqual([
      { type: 'p', spans: [{ text: 'Discografia', strong: true }] },
    ]);
  });

  it('respeta un asterisco escapado', () => {
    expect(flat('un \\*asterisco\\* literal')).toEqual([
      { type: 'p', spans: [{ text: 'un *asterisco* literal' }] },
    ]);
  });

  it('separa por lineas y descarta las vacias', () => {
    expect(flat('Primera\n\nSegunda')).toEqual([
      { type: 'p', spans: [{ text: 'Primera' }] },
      { type: 'p', spans: [{ text: 'Segunda' }] },
    ]);
  });

  it('no devuelve nada para una cadena vacia', () => {
    expect(flat('')).toEqual([]);
  });
});
