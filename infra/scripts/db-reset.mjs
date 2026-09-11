#!/usr/bin/env node
/**
 * ============================================================================
 * REINICIO DE LA BASE DE DATOS
 * ============================================================================
 * OPERACION DESTRUCTIVA: borra el esquema, lo vuelve a crear aplicando todas
 * las migraciones y ejecuta el seed. Se pierde cualquier dato que no venga del
 * seed.
 *
 *   pnpm db:reset             pide confirmacion escrita antes de borrar
 *   pnpm db:reset -- --force  sin preguntar (para CI y scripts)
 *   pnpm db:reset -- --no-seed  deja la base vacia, solo con el esquema
 *
 * TRES CANDADOS, porque un reset ejecutado por error en el sitio equivocado
 * no tiene vuelta atras:
 *
 *   1. Se niega en seco si NODE_ENV es production.
 *   2. Se niega si la cadena de conexion no apunta a localhost o 127.0.0.1,
 *      salvo que se pase --allow-remote de forma explicita.
 *   3. Sin --force, exige teclear el nombre de la base para continuar.
 *
 * Por debajo usa `prisma migrate reset` para borrar y volver a migrar, y
 * despues lanza el seed en un paso aparte: desde Prisma 7 el reset ya no
 * siembra por su cuenta.
 * ============================================================================
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');

const rootEnv = path.join(repoRoot, '.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
} else {
  console.error('No hay .env en la raiz. Ejecuta primero: pnpm setup');
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const skipSeed = args.includes('--no-seed');
const allowRemote = args.includes('--allow-remote');

/**
 * Servicios con esquema propio. De momento solo content-service; media-service
 * y chatbot-service se anaden aqui cuando tengan el suyo (Fases 5 y 7).
 */
const SERVICES = [
  {
    name: '@blackpink/content-service',
    dir: path.join(repoRoot, 'services', 'content-service'),
    urlVar: 'DATABASE_URL_CONTENT',
  },
];

/** Esquema de Postgres al que apunta una URL de conexion de Prisma. */
function schemaOf(url) {
  try {
    return new URL(url).searchParams.get('schema') ?? 'public';
  } catch {
    return 'public';
  }
}

/* --- Candado 1: nunca en produccion -------------------------------------- */
if (process.env.NODE_ENV === 'production') {
  console.error('NODE_ENV es "production". Este script no se ejecuta en produccion. Abortado.');
  process.exit(1);
}

/* --- Candado 2: solo bases locales, salvo permiso explicito --------------- */
const targets = SERVICES.filter((service) => {
  const url = process.env[service.urlVar];
  if (!url) {
    console.warn(`Aviso: falta ${service.urlVar} en el .env. Se omite ${service.name}.`);
    return false;
  }
  return true;
});

if (targets.length === 0) {
  console.error('No hay ninguna base de datos configurada que reiniciar.');
  process.exit(1);
}

for (const service of targets) {
  const url = process.env[service.urlVar];
  const isLocal = /@(localhost|127\.0\.0\.1|postgres)[:/]/.test(url);
  if (!isLocal && !allowRemote) {
    console.error(
      `\n${service.urlVar} no apunta a una base local.\n` +
        'Reiniciar una base remota borra datos de verdad.\n' +
        'Si de verdad es lo que quieres, vuelve a lanzarlo con --allow-remote.',
    );
    process.exit(1);
  }
}

/* --- Candado 3: confirmacion escrita -------------------------------------- */
const dbName = process.env.POSTGRES_DB ?? 'blackpink';

if (!force) {
  console.log('');
  console.log('  Vas a BORRAR y recrear estos esquemas:');
  for (const service of targets) {
    console.log(`    ${service.name}  ->  ${process.env[service.urlVar]}`);
  }
  console.log('');
  console.log('  Se perdera cualquier dato que no venga del seed.');
  console.log('  Si quieres conservarlo, cancela y ejecuta antes: pnpm db:backup');
  console.log('');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`  Escribe el nombre de la base ("${dbName}") para continuar: `);
  rl.close();

  if (answer.trim() !== dbName) {
    console.log('\nCancelado. No se ha tocado nada.');
    process.exit(0);
  }
}

/* --- Ejecucion ------------------------------------------------------------ */
for (const service of targets) {
  console.log(`\nReiniciando ${service.name} ...`);

  /*
   * El comando va como UN SOLO string, no como array de argumentos.
   *
   * En Windows hace falta `shell: true` para invocar pnpm: spawnSync con
   * "pnpm" da ENOENT y con "pnpm.cmd" da EINVAL desde que Node endurecio el
   * lanzamiento de ficheros .cmd. Y Node avisa (DEP0190) cuando se combina
   * `shell: true` con un array de argumentos, porque los concatena sin
   * escapar. La forma correcta es esta: el string lo compone este archivo con
   * literales fijos, sin ninguna entrada externa, asi que no hay nada que
   * escapar ni superficie de inyeccion.
   */
  const run = (args, input) => {
    const result = spawnSync(`pnpm exec prisma ${args.join(' ')}`, {
      cwd: service.dir,
      stdio: input === undefined ? 'inherit' : ['pipe', 'inherit', 'inherit'],
      input,
      shell: true,
    });
    if (result.error) {
      console.error(`\nNo se ha podido ejecutar pnpm: ${result.error.message}`);
      process.exit(1);
    }
    if (result.status !== 0) {
      console.error(`\nEl reinicio de ${service.name} ha fallado.`);
      process.exit(result.status ?? 1);
    }
  };

  const schema = schemaOf(process.env[service.urlVar]);
  console.log(`  Borrando el esquema "${schema}" y reaplicando migraciones...`);
  run(['migrate', 'reset', '--force']);

  /*
   * El seed se lanza APARTE, a proposito.
   *
   * Hasta Prisma 6, `migrate reset` ejecutaba el seed al terminar. Prisma 7 ya
   * no lo hace (por eso tampoco admite --skip-seed), asi que un script que se
   * apoyase en ese efecto secundario dejaria la base vacia sin decir nada.
   * Lanzarlo aqui, ademas, hace que --no-seed sea una rama de verdad y no un
   * flag que la herramienta ignora.
   */
  if (skipSeed) {
    console.log('  Se omite el seed (--no-seed).');
  } else {
    console.log('  Sembrando datos...');
    run(['db', 'seed']);
  }
}

console.log('\nBase de datos reiniciada.');
if (skipSeed) {
  console.log('Se ha omitido el seed (--no-seed). Para cargarlo: pnpm db:seed');
}
