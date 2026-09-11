/**
 * ============================================================================
 * EL POCO MARKDOWN QUE HABLA PINKY
 * ============================================================================
 * El modelo escribe markdown aunque no se le pida -«los albumes *THE ALBUM*
 * (2020) y *BORN PINK* (2022)»- y el panel lo pintaba como texto plano, con
 * los asteriscos a la vista.
 *
 * POR QUE UN ANALIZADOR PROPIO Y NO UNA LIBRERIA. `react-markdown` con su
 * cadena de `remark` son mas de 40 KB comprimidos, en un bundle donde acabamos
 * de quitar 193 KB de Three.js, y traen tablas, HTML embebido, notas al pie y
 * bloques de codigo que en una burbuja de chat de 23rem no tienen sentido.
 * Aqui hacen falta cinco cosas y son estas.
 *
 * POR QUE NO PEDIRSELO AL MODELO. Se podria escribir «responde en texto plano»
 * en el prompt, pero eso es una peticion, no una garantia: el dia que la
 * ignore -y la ignoran- volvemos a los asteriscos en pantalla. Esto es
 * determinista.
 *
 * LOS ENLACES SE QUEDAN EN TEXTO. `[algo](https://...)` pinta «algo» y tira la
 * URL. Es la misma regla de la Fase 9 que valida las rutas contra el mapa: una
 * direccion que propone el modelo no se convierte en algo pulsable, porque
 * inventa direcciones plausibles y un enlace con la firma del sitio que lleva
 * a cualquier parte es peor que no tener enlace.
 *
 * EL CASO DIFICIL ES EL STREAMING. A mitad de respuesta llega `*THE ALBU`, con
 * la marca abierta y sin cerrar. Ver la nota de `streaming` mas abajo.
 * ============================================================================
 */

export interface Span {
  text: string;
  strong?: boolean;
  em?: boolean;
  code?: boolean;
}

export interface Block {
  type: 'p' | 'li';
  /** Para listas numeradas, la marca original ("1."). Sin ella, es una vineta. */
  marker?: string;
  spans: Span[];
}

/** `- x`, `* x`, `1. x`. Dos digitos como mucho: "2024. Fue el año..." no es
 *  una lista, y con tres digitos lo seria. */
const BULLET = /^ {0,3}(?:([-*+])|(\d{1,2}[.)]))[ \t]+/;
const HEADING = /^ {0,3}(#{1,6})[ \t]+/;
const LINK = /^\[([^\]\n]+)\]\([^)\s]*\)/;

type Marker = '**' | '__' | '*' | '_' | '`';

/** `_` dentro de una palabra no es cursiva: `nombre_de_variable` es un nombre. */
function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && /[\p{L}\p{N}]/u.test(ch);
}

function markerAt(line: string, i: number): Marker | null {
  const two = line.slice(i, i + 2);
  if (two === '**' || two === '__') return two;
  const one = line[i];
  if (one === '*' || one === '_' || one === '`') return one;
  return null;
}

function canOpen(line: string, i: number, marker: Marker): boolean {
  const after = line[i + marker.length];
  // Una marca seguida de espacio no abre nada: `2 * 3` es una multiplicacion.
  if (after === undefined || after === ' ' || after === '\t') return false;
  if (marker === '_' || marker === '__') return !isWordChar(line[i - 1]);
  return true;
}

function canClose(line: string, i: number, marker: Marker): boolean {
  const before = line[i - 1];
  if (before === undefined || before === ' ' || before === '\t') return false;
  if (marker === '_' || marker === '__') return !isWordChar(line[i + marker.length]);
  return true;
}

function hasCloser(line: string, from: number, marker: Marker): boolean {
  for (let i = from; i <= line.length - marker.length; i += 1) {
    if (markerAt(line, i) === marker && canClose(line, i, marker)) return true;
  }
  return false;
}

function scan(line: string, streaming: boolean, forceStrong: boolean): Span[] {
  const spans: Span[] = [];
  const stack: Marker[] = [];
  let buf = '';

  function flush() {
    if (buf === '') return;
    const span: Span = { text: buf };
    if (forceStrong || stack.includes('**') || stack.includes('__')) span.strong = true;
    if (stack.includes('*') || stack.includes('_')) span.em = true;
    if (stack.includes('`')) span.code = true;
    spans.push(span);
    buf = '';
  }

  let i = 0;
  while (i < line.length) {
    const ch = line[i]!;

    if (ch === '\\' && '*_`[\\'.includes(line[i + 1] ?? '')) {
      buf += line[i + 1];
      i += 2;
      continue;
    }

    // Dentro de `codigo` no hay mas marcas que el cierre.
    if (stack[stack.length - 1] === '`') {
      if (ch === '`') {
        flush();
        stack.pop();
        i += 1;
      } else {
        buf += ch;
        i += 1;
      }
      continue;
    }

    if (ch === '[') {
      const link = LINK.exec(line.slice(i));
      if (link) {
        buf += link[1];
        i += link[0].length;
        continue;
      }
    }

    const marker = markerAt(line, i);
    if (marker) {
      if (stack[stack.length - 1] === marker && canClose(line, i, marker)) {
        flush();
        stack.pop();
        i += marker.length;
        continue;
      }

      /*
       * Se abre si hay cierre a la vista... o si la respuesta sigue llegando.
       *
       * A mitad de stream el cierre AUN NO EXISTE. Sin esta excepcion, el
       * visitante ve «*THE ALBU» con el asterisco y, cuando llega el que
       * cierra, el texto salta de golpe a cursiva. Abriendo ya, el texto entra
       * directamente en cursiva y crece dentro.
       *
       * El precio es un asterisco suelto a mitad de frase que inclina lo que
       * viene detras hasta que llegue el siguiente. Dura lo que dura el
       * stream: al terminar se vuelve a analizar con `streaming: false` y una
       * marca sin pareja se queda como lo que es, un asterisco.
       */
      const opens = !stack.includes(marker) && canOpen(line, i, marker);
      if (opens && (streaming || hasCloser(line, i + marker.length, marker))) {
        flush();
        stack.push(marker);
        i += marker.length;
        continue;
      }
    }

    buf += ch;
    i += 1;
  }

  flush();
  return spans;
}

export function parseRichText(text: string, streaming = false): Block[] {
  const blocks: Block[] = [];

  for (const raw of text.split('\n')) {
    let line = raw.replace(/\s+$/, '');
    if (line.trim() === '') continue;

    // Un titular dentro de una burbuja de chat es ruido: se queda en negrita.
    const heading = HEADING.exec(line);
    let forceStrong = false;
    if (heading) {
      line = line.slice(heading[0].length);
      forceStrong = true;
    }

    const bullet = BULLET.exec(line);
    if (bullet) {
      const spans = scan(line.slice(bullet[0].length), streaming, forceStrong);
      if (spans.length === 0) continue;
      // La marca de una lista numerada se conserva: renumerarla desde uno
      // mentiria si el modelo empezo en otro sitio.
      blocks.push(bullet[2] ? { type: 'li', marker: bullet[2], spans } : { type: 'li', spans });
      continue;
    }

    const spans = scan(line, streaming, forceStrong);
    if (spans.length > 0) blocks.push({ type: 'p', spans });
  }

  return blocks;
}
