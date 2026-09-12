// Reglas de ESLint para la web (Next.js).

import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import base from './base.mjs';

export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];
