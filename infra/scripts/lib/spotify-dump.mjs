// Lee y escribe los volcados de Spotify.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');

export const DUMP_DIR = path.join(ROOT, 'backend', 'content-service', 'prisma', 'seed-data');

export const dumpPath = (name) => path.join(DUMP_DIR, `${name}.json`);

const NOTE_KEY = '_nota';

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value === null || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortDeep(value[key])]),
  );
}

export function serialize(sections, note) {
  const body = { [NOTE_KEY]: note, ...sortDeep(sections) };
  return `${JSON.stringify(body, null, 2)}\n`;
}

export function readDump(name) {
  const file = dumpPath(name);
  if (!existsSync(file)) return null;

  const parsed = JSON.parse(readFileSync(file, 'utf8'));
  delete parsed[NOTE_KEY];
  return parsed;
}

export function writeDump(name, sections, note) {
  writeFileSync(dumpPath(name), serialize(sections, note), 'utf8');
  return dumpPath(name);
}

export function diff(current, stored) {
  const out = { missing: [], extra: [], changed: [] };
  const sections = new Set([...Object.keys(current), ...Object.keys(stored ?? {})]);

  for (const section of sections) {
    const now = current[section] ?? {};
    const before = stored?.[section] ?? {};

    for (const key of Object.keys(now)) {
      if (!(key in before)) {
        out.missing.push(`${section}/${key}`);
        continue;
      }
      const a = JSON.stringify(sortDeep(now[key]));
      const b = JSON.stringify(sortDeep(before[key]));
      if (a !== b)
        out.changed.push({ key: `${section}/${key}`, now: now[key], before: before[key] });
    }

    for (const key of Object.keys(before)) {
      if (!(key in now)) out.extra.push(`${section}/${key}`);
    }
  }

  return out;
}

export const isClean = (d) => d.missing.length + d.extra.length + d.changed.length === 0;

export function reportCheck({ name, script, dumpExists, d, colors }) {
  const { paint, C } = colors;
  const out = process.stdout;

  if (!dumpExists) {
    out.write(
      `\n${paint(C.red, '×')} No existe ${path.relative(ROOT, dumpPath(name))}.\n` +
        `  Generalo con:  node ${script} --dump\n\n`,
    );
    return false;
  }

  if (isClean(d)) {
    out.write(`\n${paint(C.green, '✓')} ${name}: la base y el volcado coinciden.\n\n`);
    return true;
  }

  out.write(`\n${paint(C.red, '×')} ${name}: la base y el volcado NO coinciden.\n\n`);

  for (const key of d.missing) {
    out.write(`  ${paint(C.yellow, 'sin versionar')}  ${key}\n`);
  }
  for (const key of d.extra) {
    out.write(
      `  ${paint(C.yellow, 'sobra')}         ${key} ${paint(C.dim, '(en el volcado y no en la base)')}\n`,
    );
  }
  for (const entry of d.changed) {
    out.write(
      `  ${paint(C.yellow, 'cambiado')}      ${entry.key}\n` +
        `      volcado: ${paint(C.dim, JSON.stringify(entry.before))}\n` +
        `      base:    ${paint(C.dim, JSON.stringify(entry.now))}\n`,
    );
  }

  out.write(
    `\n  El volcado es el registro. Si el cambio de la base es el bueno,\n` +
      `  versionalo:  node ${script} --dump\n` +
      `  Si no lo es, la base esta mal y el volcado la devolvera al sembrar.\n\n`,
  );

  return false;
}
