import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Locale } from '@blackpink/types';
import { AI_PROVIDER, type AiProvider } from '../provider/ai-provider';
import { neutralizeContext } from '../safety/sanitize';
import { VectorStoreService, type RetrievedChunk } from './vector-store.service';

/**
 * Recuperacion: de la pregunta a los fragmentos que la responden.
 *
 * El embedding de la consulta se pide con `purpose: 'query'`, no con
 * 'document'. Es el mismo modelo, pero optimiza distinto segun el papel del
 * texto; usar el mismo tipo para ambos no rompe nada de forma visible, solo
 * recupera algo peor. Los fallos silenciosos de calidad son los que nadie
 * encuentra despues.
 */
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

  /**
   * Los fragmentos, listos para meter en el prompt.
   *
   * Cada uno va etiquetado con su seccion para que el modelo pueda citar de
   * donde sale lo que dice. Sin la etiqueta, el modelo cita "el sitio" en
   * bloque y el visitante no tiene adonde ir a comprobarlo.
   */
  format(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) return '';

    /*
     * CADA FRAGMENTO SE NEUTRALIZA ANTES DE ENTRAR AL PROMPT.
     *
     * Aunque hoy al indice solo llegue contenido propio y contrastado, este
     * paso no depende de esa suposicion: retira marcadores de protocolo,
     * cabeceras de rol y cualquier cosa con forma de delimitador. Es la unica
     * capa que seguiria valiendo el dia que el sitio indexe algo que no ha
     * escrito el.
     */
    return chunks
      .map(
        (chunk, index) => `[${index + 1}] (${chunk.sourceLabel}) ${neutralizeContext(chunk.text)}`,
      )
      .join('\n\n');
  }
}
