// Guarda y busca vectores en PostgreSQL (pgvector).

import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export interface ChunkInput {
  id: string;
  sourceLabel: string;
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

    return result.rows
      .map((row) => ({
        id: row.id,
        sourceLabel: row.source_label,
        sourcePath: row.source_path,
        text: row.content,
        score: Number(row.score),
      }))
      .filter((chunk) => chunk.score >= minScore);
  }
}

function toVectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}
