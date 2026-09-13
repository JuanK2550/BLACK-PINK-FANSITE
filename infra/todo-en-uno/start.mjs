// Arranca los 5 servicios en un solo proceso, para alojarlos gratis como un único servicio web.

import { spawnSync } from 'node:child_process';
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
