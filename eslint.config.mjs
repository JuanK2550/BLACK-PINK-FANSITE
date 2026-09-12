// ESLint de la raíz: cada paquete tiene el suyo.

import base from '@blackpink/config/eslint/base';

export default [
  ...base,
  {
    ignores: ['frontend/**', 'backend/**', 'shared/**'],
  },
];
