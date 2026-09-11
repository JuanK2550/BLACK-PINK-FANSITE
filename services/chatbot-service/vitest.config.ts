import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * NestJS resuelve la inyeccion de dependencias leyendo los metadatos que
 * emite `emitDecoratorMetadata`. El transformador por defecto de Vitest
 * (esbuild) entiende los decoradores pero NO emite esos metadatos, asi que el
 * contenedor arranca sin saber que inyectar y los tests e2e fallan con
 * "Nest can't resolve dependencies".
 *
 * SWC si los emite, y ademas compila mas rapido que ts-node.
 */
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    // Los e2e levantan una aplicacion Nest completa: en paralelo compiten por
    // los mismos puertos y por la misma instancia de Redis.
    fileParallelism: false,
    testTimeout: 20000,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
