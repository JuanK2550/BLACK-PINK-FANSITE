// Convierte la URL del .env en la configuración del adaptador de Prisma.

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
    /* se ignora */
  }

  return { connectionString: url, schema };
}
