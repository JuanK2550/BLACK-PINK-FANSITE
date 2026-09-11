#!/usr/bin/env node
/**
 * ============================================================================
 * COMPROBACION DE LOS DOS VOLCADOS
 * ============================================================================
 * Lanza `--check` en los dos scripts y falla si cualquiera de los dos falla.
 *
 * Existe por un detalle que importa en un pull request: encadenarlos con `&&`
 * haria que, al fallar el primero, el segundo NI SIQUIERA SE EJECUTE. Quien
 * abre el pull request veria la mitad de la deriva, arreglaria esa mitad, y
 * volveria a fallar por la otra. Aqui corren siempre los dos y se informa de
 * todo de una vez.
 *
 * Tampoco depende de que el shell entienda `&&`, que en Windows no siempre es
 * el mismo.
 *
 *   pnpm check:spotify
 * ============================================================================
 */

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
