// Arranca los 5 servicios en un solo proceso, para alojarlos gratis como un único servicio web.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SERVICES_DIR = process.env.SERVICES_DIR ?? path.resolve(import.meta.dirname, '../../backend');

const INTERNAL = [
  ['content-service', 'CONTENT_SERVICE', 4001],
  ['media-service', 'MEDIA_SERVICE', 4002],
  ['chatbot-service', 'CHATBOT_SERVICE', 4003],
  ['speech-service', 'SPEECH_SERVICE', 4004],
];

for (const [, prefix, port] of INTERNAL) {
  process.env[`${prefix}_PORT`] = String(port);
  process.env[`${prefix}_URL`] = `http://127.0.0.1:${port}`;
}
process.env.API_GATEWAY_PORT = process.env.PORT || '10000';
// Los internos solo dentro de la máquina: Render adivina el puerto público y no debe ver otro que el del gateway.
process.env.LISTEN_HOST = '127.0.0.1';

if (process.env.MIGRATE_ON_START !== 'false') {
  const migrate = spawnSync(
    process.execPath,
    ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
    { cwd: path.join(SERVICES_DIR, 'content-service'), stdio: 'inherit' },
  );
  if (migrate.status !== 0) process.exit(migrate.status ?? 1);
}

const log = (msg, level = 'info') =>
  process.stdout.write(`${JSON.stringify({ level, name: 'todo-en-uno', msg })}
`);

// Carga el contenido del repositorio en la base cuando ha cambiado desde el último arranque.
// Así publicar contenido es solo un push: no hace falta lanzar el seed a mano contra Neon.
async function seedIfChanged() {
  if (process.env.SEED_ON_START === 'false') return;

  const prismaDir = path.join(SERVICES_DIR, 'content-service', 'prisma');
  const seed = path.join(prismaDir, 'seed.bundle.cjs');
  if (!existsSync(seed)) return log('Sin seed empaquetado: no se carga contenido.', 'warn');

  const dataDir = path.join(prismaDir, 'seed-data');
  const hash = createHash('sha256');
  hash.update(readFileSync(seed));
  for (const name of readdirSync(dataDir)
    .filter((file) => file.endsWith('.json'))
    .sort()) {
    hash.update(readFileSync(path.join(dataDir, name)));
  }
  const fingerprint = hash.digest('hex');

  const redis = connectRedis();
  const previous = redis ? await redis.get(SEED_KEY).catch(() => null) : null;

  if (previous === fingerprint) {
    log('El contenido no ha cambiado desde el último arranque.');
  } else if (run(seed) && run(path.join(prismaDir, 'check-orphans.bundle.cjs'), ['--fix'])) {
    const removed = redis ? await flushCaches(redis) : 0;
    await redis?.set(SEED_KEY, fingerprint).catch(() => undefined);
    log(`Contenido cargado; ${removed} entradas de caché vaciadas.`);
  } else {
    log('La carga de contenido ha fallado: el sitio sigue con el contenido anterior.', 'error');
  }

  await redis?.quit().catch(() => undefined);
}

const SEED_KEY = 'deploy:seed-fingerprint';

function run(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: path.dirname(script),
    stdio: 'inherit',
  });
  return result.status === 0;
}

function connectRedis() {
  if (!process.env.REDIS_URL) return null;
  const Redis = createRequire(path.join(SERVICES_DIR, 'content-service', 'package.json'))(
    'ioredis',
  );
  const client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    enableOfflineQueue: true,
  });
  client.on('error', () => undefined);
  return client;
}

async function flushCaches(redis) {
  let removed = 0;
  for (const namespace of ['content', 'media', 'gateway']) {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `${namespace}:*`, 'COUNT', 200);
      cursor = next;
      if (keys.length > 0) removed += await redis.del(...keys);
    } while (cursor !== '0');
  }
  return removed;
}

await seedIfChanged();

async function waitForHealth(name, port) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return;
    } catch {
      // Todavía arrancando.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${name} no respondió en 3 minutos`);
}

function load(name) {
  return import(pathToFileURL(path.join(SERVICES_DIR, name, 'dist/main.js')).href);
}

// En orden y esperando a cada uno: el chatbot indexa lo que publica content-service al arrancar.
for (const [name, , port] of INTERNAL) {
  await load(name);
  await waitForHealth(name, port);
}

await load('api-gateway');
await waitForHealth('api-gateway', Number(process.env.API_GATEWAY_PORT));

const megas = Math.round(process.memoryUsage().rss / 1024 / 1024);
process.stdout.write(
  `${JSON.stringify({ level: 'info', name: 'todo-en-uno', msg: `5 servicios en marcha, ${megas} MB` })}\n`,
);
