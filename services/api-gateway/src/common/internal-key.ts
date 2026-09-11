import { timingSafeEqual } from 'node:crypto';

/** Cabecera con la que el renderizado en servidor se identifica ante el gateway. */
export const INTERNAL_KEY_HEADER = 'x-internal-key';

/**
 * Compara dos secretos en tiempo CONSTANTE.
 *
 * Un `===` normal corta en el primer caracter distinto, asi que el tiempo de
 * respuesta filtra cuantos caracteres iniciales son correctos y permite
 * adivinar la clave byte a byte. `timingSafeEqual` siempre recorre todo.
 *
 * Exige buffers del mismo tamano, asi que la diferencia de longitud se
 * resuelve antes -y eso si es informacion que se filtra, pero conocer la
 * longitud de un secreto aleatorio no ayuda a adivinarlo-.
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
