// Crea el índice de búsqueda de PINKY.

import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';
import { AI_PROVIDER, AiError, type AiProvider } from '../provider/ai-provider';
import { ContentSourceService, type SourceItem } from './content-source.service';
import { VectorStoreService, type ChunkInput } from './vector-store.service';

const BATCH_SIZE = 32;
const BATCH_PAUSE_MS = 1200;

const MAX_CHARS = 900;

@Injectable()
export class IndexerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(IndexerService.name);
  private running = false;

  get isRunning(): boolean {
    return this.running;
  }

  constructor(
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
    private readonly source: ContentSourceService,
    private readonly store: VectorStoreService,
  ) {}

  onApplicationBootstrap(): void {
    void this.bootstrapIndex();
  }

  private async bootstrapIndex(): Promise<void> {
    try {
      await this.store.migrate();
    } catch (error) {
      this.logger.error(`No se pudo preparar el esquema de vectores: ${String(error)}`);
      return;
    }

    if (!this.ai.isConfigured()) {
      this.logger.warn('Sin GOOGLE_AI_API_KEY: no se indexa nada. El chat respondera 503.');
      return;
    }

    void this.reindexAll().catch((error: unknown) => {
      this.logger.error(`Indexado fallido: ${String(error)}`);
    });
  }

  async reindexAll(): Promise<void> {
    if (this.running) {
      this.logger.warn('Ya hay un indexado en curso.');
      return;
    }

    this.running = true;
    const started = Date.now();

    try {
      for (const locale of SUPPORTED_LOCALES) {
        await this.reindexLocale(locale);
      }
      this.logger.log(`Indexado completo en ${Math.round((Date.now() - started) / 1000)}s.`);
    } finally {
      this.running = false;
    }
  }

  async reindexLocale(locale: Locale): Promise<number> {
    const { items, failed } = await this.source.collectWithReport(locale);

    if (items.length === 0) {
      this.logger.warn(`"${locale}": content-service no devolvio nada. Se deja el indice intacto.`);
      return 0;
    }

    if (failed.length > 0 && (await this.store.count(locale)) > 0) {
      this.logger.warn(
        `"${locale}": sin respuesta de ${failed.join(', ')}. Se conserva el indice anterior.`,
      );
      return 0;
    }

    const pieces = items.flatMap((item) => split(item));
    const chunks: ChunkInput[] = [];

    for (let i = 0; i < pieces.length; i += BATCH_SIZE) {
      const batch = pieces.slice(i, i + BATCH_SIZE);

      let vectors: number[][];
      try {
        vectors = await this.ai.embed({ texts: batch.map((p) => p.text), purpose: 'document' });
      } catch (error) {
        if (error instanceof AiError && error.kind === 'quota') {
          this.logger.warn(`Cuota agotada indexando "${locale}". Se conserva el indice anterior.`);
          return 0;
        }
        throw error;
      }

      batch.forEach((piece, index) => {
        chunks.push({
          id: `${locale}:${piece.key}`,
          sourceLabel: piece.sourceLabel,
          sourcePath: piece.sourcePath,
          locale,
          text: piece.text,
          embedding: vectors[index]!,
        });
      });

      if (i + BATCH_SIZE < pieces.length) await sleep(BATCH_PAUSE_MS);
    }

    await this.store.replaceLocale(locale, chunks);
    return chunks.length;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function split(item: SourceItem): (SourceItem & { key: string })[] {
  const text = item.text.trim();
  if (text.length <= MAX_CHARS) return [{ ...item, text }];

  const sentences = text.split(/(?<=[.!?])\s+/);
  const parts: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length + 1 > MAX_CHARS && current.length > 0) {
      parts.push(current.trim());
      current = '';
    }
    current += `${sentence} `;
  }
  if (current.trim().length > 0) parts.push(current.trim());

  return parts.map((part, index) => ({
    ...item,
    key: `${item.key}#${index}`,
    text: part,
  }));
}
