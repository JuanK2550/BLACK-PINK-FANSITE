// Limpia el contexto para que el modelo lo trate como dato, no como orden.

import { randomBytes } from 'node:crypto';

const PROTOCOL_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\bACCION\s*:/gi, replacement: '[marcador retirado]' },
  {
    pattern: /(^|[\s.;:!?])(system|sistema|assistant|asistente|user|usuario|human|ai)\s*:/gi,
    replacement: '$1[rol retirado]',
  },
  { pattern: /<\|[^|>]{0,40}\|>/g, replacement: '[token retirado]' },
  { pattern: /\[\/?INST\]/gi, replacement: '[token retirado]' },
  { pattern: /<<\s*\/?SYS\s*>>/gi, replacement: '[token retirado]' },
  { pattern: /<<<\/?[A-Z-]+-[a-f0-9]{4,}>>>/gi, replacement: '[delimitador retirado]' },
];

const MAX_CHUNK_CHARS = 1200;

export function neutralizeContext(text: string): string {
  let clean = text;

  for (const { pattern, replacement } of PROTOCOL_PATTERNS) {
    clean = clean.replace(pattern, replacement);
  }

  return clean
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, MAX_CHUNK_CHARS);
}

export function newContextFence(): string {
  return randomBytes(6).toString('hex');
}

export function sanitizeInput(raw: string): string {
  return (
    raw
      // eslint-disable-next-line no-control-regex -- quitarlos es el proposito
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g, '')
      .replace(/\s{3,}/g, '  ')
      .trim()
  );
}
