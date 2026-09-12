#!/usr/bin/env node
// Reinicia la base: migraciones y seed.

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

const SERVICES = [
  {
    name: '@blackpink/content-service',
    dir: path.join(repoRoot, 'backend', 'content-service'),
    urlVar: 'DATABASE_URL_CONTENT',
  },
];

function schemaOf(url) {
  try {
    return new URL(url).searchParams.get('schema') ?? 'public';
  } catch {
    return 'public';
  }
}

if (process.env.NODE_ENV === 'production') {
  console.error('NODE_ENV es "production". Este script no se ejecuta en produccion. Abortado.');
  process.exit(1);
}

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

for (const service of targets) {
  console.log(`\nReiniciando ${service.name} ...`);

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
