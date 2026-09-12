// Reglas de ESLint para los servicios NestJS.

import base from './base.mjs';

export default [
  ...base,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      'no-console': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
