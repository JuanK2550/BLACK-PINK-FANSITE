// Configuración de Prisma: esquema, migraciones y seed.

import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

const rootEnv = path.resolve(import.meta.dirname, '../../.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

const migrationUrl =
  [process.env.DIRECT_URL_CONTENT, process.env.DATABASE_URL_CONTENT].find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  ) ?? undefined;

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
