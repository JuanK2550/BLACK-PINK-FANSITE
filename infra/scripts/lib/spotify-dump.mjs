/**
 * ============================================================================
 * VOLCADOS DE LO RESUELTO CONTRA SPOTIFY
 * ============================================================================
 * Lo que `spotify-ids.mjs` y `spotify-covers.mjs` averiguan vive en la base de
 * datos, y la base de datos se borra: `pnpm db:reset` la deja como recien
 * migrada y el seed no sabe nada de identificadores ni de portadas. Sin un
 * registro aparte, cada reinicio pierde 54 filas y **las tres decisiones
 * MANUAL no vuelven solas**: al quedar el campo vacio, el script ya no ve la
 * marca y vuelve a resolver por puntuacion, que es justo lo que esa marca
 * existe para impedir.
 *
 * El volcado es ese registro. Un fichero por script, versionado en git, que el
 * seed lee al sembrar.
 *
 * DOS REGLAS QUE LO DEFINEN
 *
 * 1. **MANDA EL VOLCADO.** Es el registro; el script es la forma de
 *    actualizarlo. Nunca al reves de forma automatica: nada lee la base para
 *    corregir el fichero por su cuenta.
 *
 * 2. **CONGELA.** Los valores quedan fijados hasta que alguien vuelva a pasar
 *    el script y versione el resultado. Spotify reemplaza el arte de un album
 *    de vez en cuando; con el volcado congelado, cambiar una portada es un
 *    commit que se revisa, no un efecto secundario de desplegar.
 *
 * LA PROCEDENCIA VIAJA CON EL VALOR. Cada entrada guarda su `source`
 * (SCRIPT o MANUAL). Sin eso, restaurar devolveria el dato pero perderia la
 * marca, y el script volveria a tocar lo que una persona ya decidio.
 *
 * SERIALIZACION CANONICA: claves ordenadas y sangria de dos espacios. No es
 * cosmetica. Un fichero generado tiene que dar EXACTAMENTE el mismo texto ante
 * los mismos datos, o cada pasada del script ensuciaria el diff con el orden
 * cambiado y nadie podria ver que ha cambiado de verdad.
 * ============================================================================
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');

/** Los volcados viven junto al resto de datos de siembra: los lee el seed. */
export const DUMP_DIR = path.join(ROOT, 'services', 'content-service', 'prisma', 'seed-data');

export const dumpPath = (name) => path.join(DUMP_DIR, `${name}.json`);

/**
 * Nota que encabeza el fichero.
 *
 * Va DENTRO del JSON porque JSON no admite comentarios y este fichero se abre
 * antes o despues sin el script al lado. Se ignora al comparar.
 */
const NOTE_KEY = '_nota';

/**
 * Ordena las claves de un objeto plano, recursivamente.
 *
 * `JSON.stringify` respeta el orden de insercion, y ese orden depende de en
 * que orden devolvio las filas la base. Sin ordenar, dos pasadas identicas
 * producen dos ficheros distintos.
 */
function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value === null || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortDeep(value[key])]),
  );
}

/** El texto exacto que debe tener el fichero para estos datos. */
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

/**
 * Compara lo que hay en la base con lo que dice el volcado.
 *
 * Devuelve las tres formas de diferir, separadas porque significan cosas
 * distintas: `missing` es una fila resuelta que nadie versiono, `extra` una
 * entrada del volcado que ya no corresponde a nada -tipicamente un slug que
 * se renombro- y `changed` un valor que cambio bajo la misma clave.
 */
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

/**
 * Imprime el resultado de `--check` y devuelve si esta limpio.
 *
 * Un fallo aqui tiene que explicar QUE hacer, no solo que algo no cuadra:
 * quien lo ve en un pull request no tiene por que saber que existe `--dump`.
 */
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
