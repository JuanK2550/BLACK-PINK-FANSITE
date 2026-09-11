import base from './base.mjs';

/** ESLint para los microservicios NestJS. */
export default [
  ...base,
  {
    files: ['**/*.ts'],
    rules: {
      // Los decoradores de Nest usan clases vacias como modulos.
      '@typescript-eslint/no-extraneous-class': 'off',
      // El bootstrap de cada servicio escribe en stdout al arrancar.
      'no-console': 'off',
      /*
       * DESACTIVADA A PROPOSITO, y no por comodidad.
       *
       * NestJS resuelve la inyeccion de dependencias leyendo los metadatos que
       * TypeScript emite con `emitDecoratorMetadata`. Esos metadatos solo
       * conservan la clase real si el import es de VALOR: convertir
       * `import { ConfigService }` en `import type { ConfigService }` hace que
       * el metadato pase a ser `Object` y el contenedor deje de saber que
       * inyectar. Falla en tiempo de ejecucion, al arrancar, y sin error de
       * compilacion que lo delate.
       *
       * La regla, ademas, es autocorregible: con `lint:fix` rompe la aplicacion
       * sin que nadie lo pida. En el frontend sigue activa (eslint/next.mjs y
       * base.mjs), donde no hay inyeccion por metadatos.
       */
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
