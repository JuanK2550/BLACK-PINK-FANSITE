import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * ============================================================================
 * TESTS DEL FRONTEND
 * ============================================================================
 * VITEST Y NO JEST, igual que en los servicios. El monorepo tiene un solo
 * ejecutor a propósito: dos significan dos configuraciones de transformación,
 * dos formas de simular un módulo y dos informes de cobertura que no se pueden
 * sumar.
 *
 * ENTORNO `jsdom` SOLO DONDE HACE FALTA. Los tests de funciones puras
 * —formateo de fechas, aritmética del contador, análisis de markdown— no
 * necesitan un DOM, y montarlo para ellos multiplica por diez lo que tardan.
 * Se activa por fichero con `// @vitest-environment jsdom`, y el entorno por
 * defecto sigue siendo Node.
 *
 * LA COBERTURA SE MIDE SOBRE LO QUE IMPORTA, no sobre todo. Un umbral global
 * sobre `src/**` obligaría a escribir tests de las páginas de Next —que son
 * composición y se prueban de verdad en Playwright— y premiaría rellenar
 * porcentaje en vez de cubrir lógica. `include` acota a los componentes con
 * comportamiento y a las bibliotecas puras: ahí el 60% es un suelo real.
 * ============================================================================
 */
export default defineConfig({
  /*
   * JSX AUTOMATICO, DECLARADO AQUI. El `tsconfig.json` de la app usa
   * `"jsx": "preserve"` porque quien transforma es Next, y esbuild lo hereda:
   * sin esto, cada `.tsx` de test fallaba con «React is not defined».
   *
   * SIN `@vitejs/plugin-react`, y se quito despues de probarlo: lo unico que
   * aporta sobre esta linea es la recarga en caliente, que en un test no pinta
   * nada, y su version para Vite 8 chocaba en tipos con el Vite 7 de Vitest
   * hasta tumbar el `next build`, que tambien comprueba este fichero.
   */
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    alias: {
      '@blackpink/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@blackpink/types': path.resolve(__dirname, '../../packages/types/src'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: [
        'src/lib/format.ts',
        'src/lib/debut.ts',
        'src/lib/gallery.ts',
        'src/lib/display-fit.ts',
        'src/components/chat/rich-text.ts',
        'src/components/pages/quiz-game.tsx',
        'src/components/pages/member-compare.tsx',
        'src/components/pages/gallery-grid.tsx',
        'src/components/pages/debut-counter.tsx',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
