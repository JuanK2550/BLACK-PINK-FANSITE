import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Configuracion de Prisma 7.
 *
 * A partir de la version 7 la cadena de conexion ya no vive en schema.prisma:
 * vive aqui. Eso permite leerla del unico .env de la raiz del monorepo en vez
 * de duplicar un .env por servicio.
 */
const rootEnv = path.resolve(import.meta.dirname, '../../.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

/*
 * OJO CON `??` AQUI.
 *
 * `DIRECT_URL_CONTENT` existe en el .env pero declarada VACIA (solo se usa con
 * un pooler tipo Neon o Supabase). `??` unicamente cae al segundo operando con
 * null o undefined, NO con la cadena vacia, asi que devolvia '' y Prisma
 * abortaba con "datasource.url is required" pese a tener la URL buena al lado.
 *
 * Se filtran los vacios explicitamente.
 */
const migrationUrl =
  [process.env.DIRECT_URL_CONTENT, process.env.DATABASE_URL_CONTENT].find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  ) ?? undefined;

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
    // Se ejecuta con `prisma db seed` y despues de `prisma migrate reset`.
    seed: 'tsx prisma/seed.ts',
  },

  /*
   * La cadena de conexion la usa SOLO la linea de comandos de Prisma
   * (migraciones, introspeccion, seed). La aplicacion se conecta aparte, con
   * el adaptador de driver de PrismaService.
   *
   * Neon y Supabase dan dos cadenas: una agrupada (pgbouncer) para la
   * aplicacion y una directa para las migraciones, porque un pool en modo
   * transaccion no soporta las sentencias DDL que necesita una migracion.
   * Si DIRECT_URL_CONTENT existe, manda.
   *
   * SE OMITE CUANDO NO HAY NINGUNA, en lugar de exigirla con `env()`.
   * `prisma generate` no necesita base de datos, y el postinstall lo ejecuta
   * durante el build de la imagen Docker, donde no hay ningun .env: exigirla
   * ahi rompia la construccion entera por una variable que ese comando ni
   * siquiera usa. Si falta cuando SI hace falta, la propia CLI lo dice.
   */
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
