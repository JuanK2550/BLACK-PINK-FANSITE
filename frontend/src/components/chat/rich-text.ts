// Convierte el markdown básico de las respuestas en bloques para pintar.

export interface Span {
  text: string;
  strong?: boolean;
  em?: boolean;
  code?: boolean;
}

export interface Block {
  type: 'p' | 'li';
  marker?: string;
  spans: Span[];
}

const BULLET = /^ {0,3}(?:([-*+])|(\d{1,2}[.)]))[ \t]+/;
const HEADING = /^ {0,3}(#{1,6})[ \t]+/;
const LINK = /^\[([^\]\n]+)\]\([^)\s]*\)/;

type Marker = '**' | '__' | '*' | '_' | '`';

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
      blocks.push(bullet[2] ? { type: 'li', marker: bullet[2], spans } : { type: 'li', spans });
      continue;
    }

    const spans = scan(line, streaming, forceStrong);
    if (spans.length > 0) blocks.push({ type: 'p', spans });
  }

  return blocks;
}
