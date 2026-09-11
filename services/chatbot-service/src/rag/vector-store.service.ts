import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

/**
 * ============================================================================
 * ALMACEN VECTORIAL (pgvector, esquema `chat`)
 * ============================================================================
 * chatbot-service es dueno de su esquema y de sus migraciones, igual que
 * content-service del suyo. Aqui NO se usa Prisma, y es deliberado: el tipo
 * `vector` no existe en Prisma -lo marca `Unsupported`, no se puede leer ni
 * escribir con el cliente tipado-, asi que cada consulta acabaria siendo
 * `$queryRaw`. Un generador de clientes tipados que no puede tipar la unica
 * columna que importa es peso muerto: se usa `pg` y SQL a la vista.
 *
 * LA DIMENSION SE FIJA EN LA COLUMNA. `vector(768)` no es decorativo: Postgres
 * rechaza insertar un vector de otro tamano. Si alguien cambia
 * GOOGLE_AI_EMBEDDING_DIM sin migrar, el INSERT falla en el primer indexado en
 * vez de guardar basura que solo se notaria en la calidad de las respuestas.
 * ============================================================================
 */

export interface ChunkInput {
  /** Identificador estable del fragmento: mismo contenido, misma fila. */
  id: string;
  /** Que seccion del sitio es. Se le ensena al visitante como cita. */
  sourceLabel: string;
  /** Ruta SIN prefijo de idioma: `/integrantes/rose`. */
  sourcePath: string;
  locale: string;
  text: string;
  embedding: number[];
}

export interface RetrievedChunk {
  id: string;
  sourceLabel: string;
  sourcePath: string;
  text: string;
  /** 0 a 1. 1 es identico. */
  score: number;
}

@Injectable()
export class VectorStoreService implements OnModuleDestroy {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly pool: Pool;
  private readonly dimensions: number;

  constructor(config: ConfigService) {
    const url = config.get<string>('DATABASE_URL_CHAT')?.trim();
    this.dimensions = Number(config.get<string>('GOOGLE_AI_EMBEDDING_DIM') ?? '768');

    if (!url) {
      throw new Error(
        'Falta DATABASE_URL_CHAT. Ojo: en el .env de este proyecto la variable ' +
          'existe pero puede estar VACIA, y una cadena vacia no es undefined.',
      );
    }

    this.pool = new Pool({ connectionString: url, max: 4 });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end().catch(() => undefined);
  }

  /**
   * Crea el esquema si falta. Idempotente.
   *
   * Va aqui y no en un fichero de migraciones aparte porque es UNA tabla y su
   * indice: un sistema de migraciones para esto seria mas codigo que el que
   * migra.
   */
  async migrate(): Promise<void> {
    await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    await this.pool.query('CREATE SCHEMA IF NOT EXISTS chat');

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS chat.knowledge_chunks (
        id           text PRIMARY KEY,
        source_label text NOT NULL,
        source_path  text NOT NULL,
        locale       text NOT NULL,
        content      text NOT NULL,
        embedding    vector(${this.dimensions}) NOT NULL,
        indexed_at   timestamptz NOT NULL DEFAULT now()
      )
    `);

    /*
     * Indice HNSW sobre distancia coseno.
     *
     * AQUI ESTA LA RAZON DE LA DIMENSION 768: pgvector no puede indexar
     * columnas de mas de 2000 dimensiones. Con las 3072 por defecto de
     * gemini-embedding-001 esta linea falla y toda busqueda pasa a ser un
     * escaneo secuencial.
     */
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
        ON chat.knowledge_chunks USING hnsw (embedding vector_cosine_ops)
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS knowledge_chunks_locale_idx
        ON chat.knowledge_chunks (locale)
    `);
  }

  async count(locale?: string): Promise<number> {
    const result = locale
      ? await this.pool.query<{ n: string }>(
          'SELECT count(*)::text AS n FROM chat.knowledge_chunks WHERE locale = $1',
          [locale],
        )
      : await this.pool.query<{ n: string }>(
          'SELECT count(*)::text AS n FROM chat.knowledge_chunks',
        );

    return Number(result.rows[0]?.n ?? '0');
  }

  /**
   * Sustituye TODO el indice de un idioma por el que se le pasa.
   *
   * Reemplazo completo dentro de una transaccion, no actualizacion fragmento a
   * fragmento. El motivo es la regla que gobierna este servicio: si un dato
   * pasa de `verified: true` a `false`, o se borra del catalogo, tiene que
   * DESAPARECER del indice. Actualizando solo lo que llega, lo retirado se
   * quedaria indexado para siempre y el bot seguiria citandolo.
   */
  async replaceLocale(locale: string, chunks: ChunkInput[]): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM chat.knowledge_chunks WHERE locale = $1', [locale]);

      for (const chunk of chunks) {
        if (chunk.embedding.length !== this.dimensions) {
          throw new Error(
            `Vector de ${chunk.embedding.length} dimensiones para una columna de ${this.dimensions}.`,
          );
        }

        await client.query(
          `INSERT INTO chat.knowledge_chunks
             (id, source_label, source_path, locale, content, embedding)
           VALUES ($1, $2, $3, $4, $5, $6::vector)`,
          [
            chunk.id,
            chunk.sourceLabel,
            chunk.sourcePath,
            chunk.locale,
            chunk.text,
            toVectorLiteral(chunk.embedding),
          ],
        );
      }

      await client.query('COMMIT');
      this.logger.log(`Indice de "${locale}": ${chunks.length} fragmentos.`);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Los fragmentos mas parecidos a la consulta.
   *
   * `1 - (a <=> b)` convierte la distancia coseno de pgvector en una similitud
   * de 0 a 1, que es como se lee en el resto del servicio.
   */
  async search(
    locale: string,
    embedding: number[],
    limit = 6,
    minScore = 0.35,
  ): Promise<RetrievedChunk[]> {
    const result = await this.pool.query<{
      id: string;
      source_label: string;
      source_path: string;
      content: string;
      score: number;
    }>(
      `SELECT id, source_label, source_path, content,
              1 - (embedding <=> $2::vector) AS score
         FROM chat.knowledge_chunks
        WHERE locale = $1
        ORDER BY embedding <=> $2::vector
        LIMIT $3`,
      [locale, toVectorLiteral(embedding), limit],
    );

    return (
      result.rows
        .map((row) => ({
          id: row.id,
          sourceLabel: row.source_label,
          sourcePath: row.source_path,
          text: row.content,
          score: Number(row.score),
        }))
        /*
         * Se descarta lo que no se parece lo suficiente. Sin umbral, una
         * pregunta sin respuesta en el sitio recuperaria igualmente los seis
         * fragmentos menos malos y el modelo intentaria contestar con ellos:
         * asi es como un RAG se inventa las cosas con aire de fuente.
         */
        .filter((chunk) => chunk.score >= minScore)
    );
  }
}

/** pgvector espera el literal `[1,2,3]`, no un array de Postgres. */
function toVectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}
