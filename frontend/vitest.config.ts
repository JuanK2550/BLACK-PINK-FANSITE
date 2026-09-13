// Configuración de Vitest para la web y umbral de cobertura.

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    alias: {
      '@blackpink/ui': path.resolve(__dirname, '../shared/ui/src'),
      '@blackpink/types': path.resolve(__dirname, '../shared/types/src'),
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
        'src/lib/security-headers.ts',
        'src/lib/sentry.ts',
        'src/components/chat/rich-text.ts',
        'src/components/quiz/quiz-game.tsx',
        'src/components/members/member-compare.tsx',
        'src/components/gallery/gallery-grid.tsx',
        'src/components/gallery/lightbox.tsx',
        'src/components/quiz/quiz-bar.tsx',
        'src/components/quiz/quiz-result.tsx',
        'src/components/members/member-compare-rows.tsx',
        'src/components/group/debut-counter.tsx',
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
