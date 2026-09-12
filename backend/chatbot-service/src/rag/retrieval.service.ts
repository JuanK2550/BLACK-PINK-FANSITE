// Busca los fragmentos que responden a una pregunta.

import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Locale } from '@blackpink/types';
import { AI_PROVIDER, type AiProvider } from '../provider/ai-provider';
import { neutralizeContext } from '../safety/sanitize';
import { VectorStoreService, type RetrievedChunk } from './vector-store.service';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
    private readonly store: VectorStoreService,
  ) {}

  async retrieve(question: string, locale: Locale, limit = 6): Promise<RetrievedChunk[]> {
    const [embedding] = await this.ai.embed({ texts: [question], purpose: 'query' });
    if (!embedding) return [];

    const chunks = await this.store.search(locale, embedding, limit);
    this.logger.debug(`"${locale}": ${chunks.length} fragmentos por encima del umbral.`);
    return chunks;
  }

  format(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) return '';

    return chunks
      .map(
        (chunk, index) => `[${index + 1}] (${chunk.sourceLabel}) ${neutralizeContext(chunk.text)}`,
      )
      .join('\n\n');
  }
}
