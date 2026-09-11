import base from '@blackpink/config/eslint/base';

export default [
  ...base,
  {
    ignores: ['apps/**', 'services/**', 'packages/**'],
  },
];
