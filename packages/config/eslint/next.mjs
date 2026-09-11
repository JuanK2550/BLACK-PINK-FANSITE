import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import base from './base.mjs';

/** ESLint para apps/web (Next.js 15 + React 19). */
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
