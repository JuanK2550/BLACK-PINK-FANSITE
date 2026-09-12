// Configuración de Vitest (SWC para los decoradores de Nest).

import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 20000,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
