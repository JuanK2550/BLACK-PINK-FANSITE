// Reglas de ESLint de la web.

import next from '@blackpink/config/eslint/next';

export default [...next, { ignores: ['.next/**', 'next-env.d.ts'] }];
