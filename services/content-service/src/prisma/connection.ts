/**
 * Traduce la URL de conexion del .env a lo que espera el adaptador de Prisma 7.
 *
 * POR QUE EXISTE ESTE ARCHIVO:
 *
 * Hasta Prisma 6 el motor interpretaba el parametro `?schema=content` de la
 * cadena de conexion y ajustaba el search_path el solo. Desde Prisma 7 la
 * conexion la abre un driver real (`pg`), y `pg` no sabe nada de ese
 * parametro: es una invencion de Prisma. Si no se le pasa el esquema aparte,
 * el cliente consulta el search_path por defecto (`public`) y todas las
 * consultas fallan con "la tabla no existe", aunque las migraciones se hayan
 * aplicado perfectamente en `content`.
 *
 * La linea de comandos de Prisma SI sigue leyendo `?schema=`, asi que las
 * migraciones funcionan y solo falla el tiempo de ejecucion. De ahi que el
 * esquema se extraiga siempre de la misma URL: una sola fuente de verdad para
 * las dos rutas.
 */

export interface PrismaConnection {
  connectionString: string;
  schema: string;
}

const DEFAULT_SCHEMA = 'content';

export function parseConnection(url: string | undefined): PrismaConnection {
  if (!url) {
    throw new Error(
      'Falta DATABASE_URL_CONTENT. Ejecuta `pnpm setup` para crear el .env de la raiz.',
    );
  }

  let schema = DEFAULT_SCHEMA;
  try {
    schema = new URL(url).searchParams.get('schema') ?? DEFAULT_SCHEMA;
  } catch {
    // Una URL que ni siquiera se puede analizar la rechazara `pg` con un
    // mensaje mucho mas util que cualquier cosa que pudiera decir aqui.
  }

  return { connectionString: url, schema };
}
