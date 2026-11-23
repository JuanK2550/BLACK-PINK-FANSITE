// Empaqueta el seed y db:orphans en JavaScript, para ejecutarlos en la imagen de producción.

import path from 'node:path';
import { build } from 'esbuild';

const PRISMA_DIR = import.meta.dirname;

// El cliente generado se queda fuera del paquete: carga sus ficheros por ruta relativa.
const keepGeneratedExternal = {
  name: 'generated-external',
  setup(context) {
    context.onResolve({ filter: /^\.\/generated\// }, (args) => ({
      path: args.path,
      external: true,
    }));
  },
};

await build({
  entryPoints: {
    'seed.bundle': path.join(PRISMA_DIR, 'seed.ts'),
    'check-orphans.bundle': path.join(PRISMA_DIR, 'check-orphans.ts'),
  },
  outdir: PRISMA_DIR,
  outExtension: { '.js': '.cjs' },
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  packages: 'external',
  define: { 'import.meta.dirname': '__dirname' },
  plugins: [keepGeneratedExternal],
  logLevel: 'warning',
});
