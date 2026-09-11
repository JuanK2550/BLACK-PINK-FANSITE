#!/usr/bin/env node
/**
 * ============================================================================
 * COPIA DE SEGURIDAD DE LA BASE DE DATOS
 * ============================================================================
 * Vuelca la base completa (los tres esquemas: content, media y chat) a un
 * archivo con marca de tiempo en infra/backups/.
 *
 *   pnpm db:backup                 copia completa en formato custom de pg_dump
 *   pnpm db:backup -- --plain      volcado en SQL plano, legible y diffeable
 *   pnpm db:backup -- --keep 20    conserva las 20 ultimas copias (por defecto 10)
 *
 * COMO SE RESTAURA (el script lo recuerda al terminar):
 *   pg_restore --clean --if-exists -d "$DATABASE_URL_CONTENT" archivo.dump
 *
 * El script busca pg_dump en este orden:
 *   1. El contenedor de Postgres de infra/docker-compose, si esta levantado.
 *      Asi la version de pg_dump coincide siempre con la del servidor.
 *   2. Un pg_dump instalado en el sistema.
 * Si no encuentra ninguno, lo dice y no deja un archivo a medias.
 * ============================================================================
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const backupDir = path.join(repoRoot, 'infra', 'backups');

const rootEnv = path.join(repoRoot, '.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
} else {
  console.error('No hay .env en la raiz. Ejecuta primero: pnpm setup');
  process.exit(1);
}

const args = process.argv.slice(2);
const plain = args.includes('--plain');
const keepIndex = args.indexOf('--keep');
const keep = keepIndex >= 0 ? Number.parseInt(args[keepIndex + 1] ?? '', 10) : 10;

if (!Number.isInteger(keep) || keep < 1) {
  console.error('--keep necesita un numero entero mayor que cero.');
  process.exit(1);
}

const { POSTGRES_USER, POSTGRES_DB, POSTGRES_PASSWORD } = process.env;
if (!POSTGRES_USER || !POSTGRES_DB) {
  console.error('Faltan POSTGRES_USER o POSTGRES_DB en el .env de la raiz.');
  process.exit(1);
}

/*
 * Se detecta por NOMBRE de contenedor, no por proyecto de compose.
 * Los dos ficheros de compose del proyecto (el completo y el de solo
 * dependencias) declaran `container_name: bp-postgres` pero usan nombres de
 * proyecto distintos, asi que preguntar por el proyecto solo acierta con uno
 * de los dos y falla justo en el flujo mas habitual: `pnpm docker:up:deps`.
 */
const CONTAINER = 'bp-postgres';

/** true si el contenedor de Postgres del proyecto esta corriendo. */
function postgresContainerIsUp() {
  const result = spawnSync(
    'docker',
    ['ps', '--filter', `name=^/${CONTAINER}$`, '--filter', 'status=running', '--quiet'],
    { encoding: 'utf8' },
  );
  return result.status === 0 && result.stdout.trim().length > 0;
}

function hasLocalPgDump() {
  const result = spawnSync('pg_dump', ['--version'], { encoding: 'utf8' });
  return result.status === 0;
}

mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const extension = plain ? 'sql' : 'dump';
const outputName = `blackpink-${stamp}.${extension}`;
const outputPath = path.join(backupDir, outputName);

const dumpArgs = [
  '--username',
  POSTGRES_USER,
  '--dbname',
  POSTGRES_DB,
  '--no-owner',
  '--no-privileges',
  ...(plain ? [] : ['--format=custom']),
];

console.log(`Volcando "${POSTGRES_DB}" a infra/backups/${outputName} ...`);

let result;
if (postgresContainerIsUp()) {
  console.log('  Usando el pg_dump del contenedor de Postgres.');
  result = spawnSync('docker', ['exec', CONTAINER, 'pg_dump', ...dumpArgs], {
    encoding: 'buffer',
    maxBuffer: 1024 * 1024 * 512,
  });
} else if (hasLocalPgDump()) {
  console.log('  El contenedor no esta levantado. Usando el pg_dump del sistema.');
  result = spawnSync('pg_dump', ['--host', 'localhost', ...dumpArgs], {
    encoding: 'buffer',
    maxBuffer: 1024 * 1024 * 512,
    env: { ...process.env, PGPASSWORD: POSTGRES_PASSWORD ?? '' },
  });
} else {
  console.error(
    '\nNo hay forma de volcar la base: ni el contenedor de Postgres esta levantado\n' +
      'ni hay un pg_dump instalado en el sistema.\n\n' +
      'Levanta la base con:  pnpm docker:up:deps\n' +
      'o instala las herramientas de cliente de PostgreSQL.',
  );
  process.exit(1);
}

if (result.error) {
  console.error(`\nNo se ha podido ejecutar pg_dump: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error('\npg_dump ha fallado:\n');
  console.error(result.stderr?.toString() ?? '(sin salida de error)');
  process.exit(1);
}

writeFileSync(outputPath, result.stdout);

const sizeMb = (statSync(outputPath).size / 1024 / 1024).toFixed(2);
console.log(`Copia creada: infra/backups/${outputName}  (${sizeMb} MB)`);

/* --- Poda: se conservan las `keep` copias mas recientes. ------------------ */
const existing = readdirSync(backupDir)
  .filter((name) => /^blackpink-.*\.(dump|sql)$/.test(name))
  .map((name) => ({ name, time: statSync(path.join(backupDir, name)).mtimeMs }))
  .sort((a, b) => b.time - a.time);

const stale = existing.slice(keep);
for (const file of stale) {
  unlinkSync(path.join(backupDir, file.name));
}
if (stale.length > 0) {
  console.log(
    `Podadas ${stale.length} copia(s) antigua(s). Se conservan las ${keep} mas recientes.`,
  );
}

console.log('\nPara restaurarla:');
console.log(
  plain
    ? `  psql "$DATABASE_URL_CONTENT" -f infra/backups/${outputName}`
    : `  pg_restore --clean --if-exists -d "$DATABASE_URL_CONTENT" infra/backups/${outputName}`,
);
