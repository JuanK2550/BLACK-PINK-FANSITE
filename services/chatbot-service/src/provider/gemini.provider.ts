import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiError, type AiProvider, type ChatRequest, type EmbedRequest } from './ai-provider';

/**
 * ============================================================================
 * GEMINI (Google AI Studio)
 * ============================================================================
 * Implementacion del contrato contra la API REST de Gemini. Sin SDK: son dos
 * endpoints, y una dependencia menos es una superficie menos que auditar y
 * actualizar.
 *
 * CUATRO COSAS QUE NO SON OBVIAS:
 *
 * 1. LA CLAVE VIAJA EN UNA CABECERA, no en la query string. Con `?key=` acaba
 *    escrita en los logs de cualquier proxy intermedio. `x-goog-api-key` no.
 *
 * 2. EL PLAN GRATUITO TIENE LIMITES BAJOS por minuto y por dia. Un 429 no es
 *    un error del sitio: es la cuota. Se reintenta con espera exponencial y se
 *    respeta el `RetryInfo` que envia Google cuando lo envia. Si tras los
 *    reintentos sigue agotada, se convierte en AiError('quota') y la capa de
 *    arriba se lo explica al visitante en su idioma.
 *
 * 3. LA DIMENSION DEL EMBEDDING SE FIJA A MANO y hay que NORMALIZAR. Con
 *    `gemini-embedding-001`, cualquier dimension distinta de 3072 sale sin
 *    normalizar; la similitud coseno de pgvector asume norma 1. Sin este paso
 *    la recuperacion no falla: empeora en silencio, que es peor.
 *
 * 4. EL STREAM ES SSE y llega troceado por la red. Los trozos NO coinciden con
 *    los eventos: un `data:` puede partirse entre dos lecturas del socket. Por
 *    eso hay un bufer y se corta por linea, nunca por trozo recibido.
 * ============================================================================
 */

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/** Reintentos ante 429/5xx. Cuatro intentos: ~1s, 2s, 4s. */
const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  private readonly apiKey: string;
  private readonly chatModel: string;
  private readonly embeddingModel: string;
  private readonly embeddingDim: number;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GOOGLE_AI_API_KEY')?.trim() ?? '';
    this.chatModel = config.get<string>('GOOGLE_AI_CHAT_MODEL')?.trim() || 'gemini-3.5-flash-lite';
    this.embeddingModel =
      config.get<string>('GOOGLE_AI_EMBEDDING_MODEL')?.trim() || 'gemini-embedding-001';
    this.embeddingDim = Number(config.get<string>('GOOGLE_AI_EMBEDDING_DIM') ?? '768');

    if (!this.isConfigured()) {
      // Aviso, no excepcion: el servicio arranca igual y /health responde. Lo
      // que no funciona es el chat, y lo dice cuando se le pregunta.
      this.logger.warn(
        'GOOGLE_AI_API_KEY vacia: el chat respondera 503 y no se indexara nada. ' +
          'Ver README, seccion "Chatbot PINKY".',
      );
    }
  }

  describe(): string {
    return `gemini(${this.chatModel}, ${this.embeddingModel}@${this.embeddingDim})`;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  get dimensions(): number {
    return this.embeddingDim;
  }

  /* --------------------------------------------------------------- chat --- */

  async *streamChat(request: ChatRequest, signal?: AbortSignal): AsyncIterable<string> {
    this.assertConfigured();

    const body = {
      systemInstruction: { parts: [{ text: request.system }] },
      contents: [
        ...request.history.map((turn) => ({
          role: turn.role,
          parts: [{ text: turn.text }],
        })),
        { role: 'user', parts: [{ text: request.message }] },
      ],
      generationConfig: {
        // Bajo a proposito: es un guia de un sitio de consulta, no un escritor
        // creativo. Cuanto mas alto, mas facil que adorne un dato.
        temperature: 0.3,
        /*
         * 2048 Y NO 800, POR ALGO QUE NO SE VE EN LA RESPUESTA.
         *
         * Los modelos Gemini 3 razonan antes de contestar, y esos tokens de
         * pensamiento CUENTAN contra este limite: en una prueba real gastaron
         * 451 de 579 para una respuesta de 107. Con 800 de tope, una pregunta
         * en coreano -que ademas gasta mas tokens por caracter- se quedaba
         * cortada a media frase, sin error y sin aviso: el modelo terminaba
         * con MAX_TOKENS y el visitante veia una frase incompleta.
         *
         * El parametro para reducir el pensamiento (`thinkingLevel`,
         * `thinking_level`) NO existe en la API REST v1beta: devuelve 400.
         * Asi que el margen se da por tokens.
         */
        maxOutputTokens: 2048,
      },
    };

    const response = await this.fetchWithRetry(
      `${BASE_URL}/models/${encodeURIComponent(this.chatModel)}:streamGenerateContent?alt=sse`,
      body,
      signal,
    );

    const reader = response.body?.getReader();
    if (!reader) throw new AiError('upstream', 'Gemini no devolvio cuerpo en el stream.');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Se corta por linea completa: un evento puede quedar partido entre
        // dos lecturas del socket.
        let newline = buffer.indexOf('\n');
        while (newline !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf('\n');

          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          /*
           * Una respuesta cortada por el limite de tokens NO es un error para
           * la API: llega un `finishReason` y ya. Si nadie lo mira, el
           * visitante recibe media frase y el servicio cree que fue bien.
           */
          if (finishedByLimit(payload)) {
            this.logger.warn(
              `Respuesta truncada por maxOutputTokens en ${this.chatModel}. ` +
                'Subir el limite o acortar el contexto.',
            );
          }

          const text = extractText(payload);
          if (text) yield text;
        }
      }
    } finally {
      await reader.cancel().catch(() => undefined);
    }
  }

  /* --------------------------------------------------------- embeddings --- */

  async embed(request: EmbedRequest): Promise<number[][]> {
    this.assertConfigured();
    if (request.texts.length === 0) return [];

    const taskType = request.purpose === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT';

    const body = {
      requests: request.texts.map((text) => ({
        model: `models/${this.embeddingModel}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: this.embeddingDim,
      })),
    };

    const response = await this.fetchWithRetry(
      `${BASE_URL}/models/${encodeURIComponent(this.embeddingModel)}:batchEmbedContents`,
      body,
    );

    const data = (await response.json()) as { embeddings?: { values?: number[] }[] };
    const vectors = data.embeddings ?? [];

    if (vectors.length !== request.texts.length) {
      throw new AiError(
        'upstream',
        `Gemini devolvio ${vectors.length} vectores para ${request.texts.length} textos.`,
      );
    }

    return vectors.map((entry) => normalize(entry.values ?? []));
  }

  /* ------------------------------------------------------------ interno --- */

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new AiError(
        'not_configured',
        'Falta GOOGLE_AI_API_KEY. Ver README, seccion "Chatbot PINKY".',
      );
    }
  }

  /**
   * POST con reintentos y espera exponencial.
   *
   * Se reintenta ante 429 y ante 5xx. NO se reintenta ante 4xx que no sea 429:
   * una peticion mal formada seguira mal formada, y reintentarla solo gasta
   * cuota que en el plan gratuito es exactamente lo que escasea.
   */
  private async fetchWithRetry(
    url: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<Response> {
    let lastRetryAfter: number | undefined;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      let response: Response;

      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            // En cabecera, no en la query: una clave en la URL se queda
            // escrita en los logs de cualquier intermediario.
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify(body),
          signal,
        });
      } catch (error) {
        if (signal?.aborted) throw new AiError('aborted', 'Peticion cancelada.');
        if (attempt === MAX_ATTEMPTS - 1) {
          throw new AiError('upstream', `No se pudo contactar con Gemini: ${String(error)}`);
        }
        await sleep(BASE_DELAY_MS * 2 ** attempt);
        continue;
      }

      if (response.ok) return response;

      const retryable = response.status === 429 || response.status >= 500;
      const detail = await response.text().catch(() => '');

      if (response.status === 429) {
        lastRetryAfter = parseRetryAfter(response, detail);
      }

      if (!retryable || attempt === MAX_ATTEMPTS - 1) {
        // El cuerpo del error NO se propaga hacia arriba: puede repetir la
        // peticion entera, y con ella lo que haya escrito el visitante.
        this.logger.warn(`Gemini HTTP ${response.status} en ${new URL(url).pathname}`);

        throw response.status === 429
          ? new AiError('quota', 'Cuota de Gemini agotada.', lastRetryAfter)
          : new AiError('upstream', `Gemini devolvio HTTP ${response.status}.`);
      }

      const wait = lastRetryAfter ? lastRetryAfter * 1000 : BASE_DELAY_MS * 2 ** attempt;
      this.logger.debug(`Gemini ${response.status}: reintento en ${wait}ms`);
      await sleep(wait);
    }

    throw new AiError('upstream', 'Gemini agoto los reintentos.');
  }
}

/* ------------------------------------------------------------- ayudas --- */

/** true si Gemini corto la respuesta por quedarse sin tokens. */
function finishedByLimit(payload: string): boolean {
  try {
    const parsed = JSON.parse(payload) as { candidates?: { finishReason?: string }[] };
    return parsed.candidates?.[0]?.finishReason === 'MAX_TOKENS';
  } catch {
    return false;
  }
}

/** Saca el texto de un evento SSE de Gemini, tolerando formas inesperadas. */
function extractText(payload: string): string {
  try {
    const parsed = JSON.parse(payload) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return (parsed.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('');
  } catch {
    // Un evento ilegible se ignora en vez de tumbar el stream: el resto de la
    // respuesta sigue siendo util.
    return '';
  }
}

/**
 * Segundos de espera que pide Google.
 *
 * Llega de dos formas segun el endpoint: la cabecera `retry-after` estandar, o
 * un `RetryInfo` dentro del JSON de error con la forma `"retryDelay": "17s"`.
 */
function parseRetryAfter(response: Response, body: string): number | undefined {
  const header = response.headers.get('retry-after');
  if (header && Number.isFinite(Number(header))) return Number(header);

  const match = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body);
  return match ? Math.ceil(Number(match[1])) : undefined;
}

/**
 * Normaliza a norma 1.
 *
 * Obligatorio con `gemini-embedding-001` en cualquier dimension distinta de
 * 3072: el modelo devuelve el vector truncado SIN renormalizar, y la distancia
 * coseno de pgvector da por hecho que la norma es 1.
 */
function normalize(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return values;
  return values.map((value) => value / norm);
}
