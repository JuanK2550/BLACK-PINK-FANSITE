// Clave interna que exime al servidor web del límite por IP.

import { timingSafeEqual } from 'node:crypto';

export const INTERNAL_KEY_HEADER = 'x-internal-key';

export function timingSafeEqualStrings(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
