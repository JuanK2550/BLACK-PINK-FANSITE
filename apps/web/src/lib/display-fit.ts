/**
 * ============================================================================
 * CUANTO OCUPA UNA PALABRA EN LA FUENTE DISPLAY
 * ============================================================================
 * Un titular display no se puede partir por dentro de una palabra, y la escala
 * `text-5xl` crece con la VENTANA, no con la columna. En la ficha de disco,
 * «BLACKPINK» se salía 390px por la derecha a 1024px de ancho.
 *
 * `.bp-fit-title` (globals.css) resuelve el tamaño contra el ancho real de la
 * columna (`cqi`), y para eso necesita saber cuánto mide la palabra más larga
 * en `em`. Contar letras no basta: en Syne 800 una «I» mide 0,39em y una «W»
 * 1,85em. Con una media, «BLACKPINK» cabía y «SQUARE» seguía saliéndose.
 *
 * ANCHOS MEDIDOS, no copiados de la tipografía: `measureText` de un canvas con
 * la Syne 800 que sirve el sitio, a 100px, con el `letter-spacing` de -0,03em
 * de la escala ya descontado. Si se cambia la fuente display, esta tabla se
 * vuelve a medir.
 * ============================================================================
 */

// prettier-ignore
const WIDTHS: Record<string, number> = {
  A: 1.13, B: 1.11, C: 1.29, D: 1.27, E: 1.11, F: 1.1, G: 1.31, H: 1.25, I: 0.39,
  J: 0.97, K: 1.19, L: 0.91, M: 1.55, N: 1.27, O: 1.3, P: 1.15, Q: 1.3, R: 1.2,
  S: 1.03, T: 1.07, U: 1.26, V: 1.13, W: 1.85, X: 1.11, Y: 1.04, Z: 1.17,
  a: 1.03, b: 1.07, c: 0.96, d: 1.07, e: 0.96, f: 0.64, g: 0.94, h: 0.98, i: 0.33,
  j: 0.33, k: 0.91, l: 0.33, m: 1.62, n: 0.97, o: 0.99, p: 1.03, q: 1.07, r: 0.53,
  s: 0.81, t: 0.6, u: 0.97, v: 0.89, w: 1.43, x: 0.95, y: 0.9, z: 0.87,
  '0': 1.04, '1': 0.5, '2': 0.97, '3': 1.02, '4': 1.06, '5': 0.98, '6': 1.1,
  '7': 1.12, '8': 1.05, '9': 1.13, '.': 0.32, '(': 0.38, ')': 0.38, '&': 1.19,
  '-': 0.56,
};

/**
 * Lo que no está en la tabla —hangul, acentos, signos raros— cuenta como una
 * mayúscula ancha. Pasarse encoge un poco el titular; quedarse corto lo saca
 * de la columna, que es el fallo que esto existe para evitar.
 */
const UNKNOWN = 1.3;

/** Ancho en `em` de la palabra más larga del texto. */
export function longestWordEm(text: string): number {
  let widest = 0;
  for (const word of text.split(/\s+/)) {
    let width = 0;
    for (const char of word) width += WIDTHS[char] ?? UNKNOWN;
    widest = Math.max(widest, width);
  }
  // Redondeo hacia arriba a centésimas: la variable CSS no necesita más.
  return Math.ceil(widest * 100) / 100;
}
