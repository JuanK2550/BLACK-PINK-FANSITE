#!/usr/bin/env node
// Comprueba que la base coincide con los volcados de Spotify.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const HERE = import.meta.dirname;

const SCRIPTS = ['spotify-ids.mjs', 'spotify-covers.mjs'];

let failed = 0;

for (const script of SCRIPTS) {
  const result = spawnSync(process.execPath, [path.join(HERE, script), '--check'], {
    stdio: 'inherit',
  });

  if (result.status !== 0) failed += 1;
}

if (failed > 0) {
  process.stderr.write(
    `\n${failed} de ${SCRIPTS.length} volcados no coinciden con la base. Detalle arriba.\n\n`,
  );
  process.exitCode = 1;
}
