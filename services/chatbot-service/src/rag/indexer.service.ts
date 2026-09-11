import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';
import { AI_PROVIDER, AiError, type AiProvider } from '../provider/ai-provider';
import { ContentSourceService, type SourceItem } from './content-source.service';
import { VectorStoreService, type ChunkInput } from './vector-store.service';

/**
 * ============================================================================
 * INDEXADO
 * ============================================================================
 * Al arrancar, lee el contenido publicable de content-service, lo trocea, pide
 * un vector por trozo y reemplaza el indice.
 *
 * TRES DECISIONES:
 *
 * 1. NO BLOQUEA EL ARRANQUE. Se lanza en segundo plano. Indexar son decenas de
 *    llamadas a una API con cuota; encadenarlas al arranque significa que un
 *    429 de Google deja el contenedor sin pasar el HEALTHCHECK y Docker lo
 *    reinicia, lo que reintenta el indexado, que vuelve a chocar con la cuota.
 *
 * 2. POR LOTES Y CON PAUSA. El plan gratuito limita peticiones por minuto. Los
 *    textos van de 32 en 32 con una pausa corta entre lotes: mas lento a
 *    proposito, para no gastar en el arranque la cuota que necesitan las
 *    preguntas de los visitantes.
 *
 * 3. SIN CLAVE NO ES UN ERROR. Se avisa y se sigue. El servicio arranca, el
 *    /health responde y el chat explica por que no puede contestar.
 * ============================================================================
 */

const BATCH_SIZE = 32;
const BATCH_PAUSE_MS = 1200;

/** Trozos mas largos que esto se parten. Ni tan corto que pierda contexto, ni
 *  tan largo que un fragmento recuperado traiga media pagina de ruido. */
const MAX_CHARS = 900;

@Injectable()
export class IndexerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(IndexerService.name);
  private running = false;

  /** Si hay un indexado en marcha. Lo consulta el endpoint de reindexado. */
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

    // Sin await: el arranque no espera al indexado.
    void this.reindexAll().catch((error: unknown) => {
      this.logger.error(`Indexado fallido: ${String(error)}`);
    });
  }

  /** Reindexa los tres idiomas. Reentrante: si ya hay uno en curso, no empieza otro. */
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

    /*
     * INCOMPLETO Y CON UN INDICE ANTERIOR: se conserva el anterior. Es la misma
     * regla que la de la cuota, un poco mas abajo: uno a medias deja a PINKY
     * con media discografia y sin saberlo, mientras que el anterior solo esta
     * algo viejo. SIN indice anterior el parcial si entra, porque la
     * alternativa es un chat mudo (ver `collect`).
     */
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
          /*
           * Cuota agotada a mitad. Se ABANDONA sin escribir nada: el indice
           * anterior sigue siendo consistente, mientras que uno a medias
           * dejaria a PINKY con media discografia y sin saberlo.
           */
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

/**
 * Parte un item largo en trozos que quepan, cortando por frase.
 *
 * Cortar por caracteres a pelo parte palabras y numeros -"public" / "ado en
 * 20" / "22"-, y un fragmento asi recuperado le da al modelo una fecha rota
 * que puede acabar citando.
 */
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
