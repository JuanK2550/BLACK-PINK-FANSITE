// Proveedor de IA con Google Gemini.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiError, type AiProvider, type ChatRequest, type EmbedRequest } from './ai-provider';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

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
        temperature: 0.3,
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

        let newline = buffer.indexOf('\n');
        while (newline !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf('\n');

          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

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

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new AiError(
        'not_configured',
        'Falta GOOGLE_AI_API_KEY. Ver README, seccion "Chatbot PINKY".',
      );
    }
  }

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

function finishedByLimit(payload: string): boolean {
  try {
    const parsed = JSON.parse(payload) as { candidates?: { finishReason?: string }[] };
    return parsed.candidates?.[0]?.finishReason === 'MAX_TOKENS';
  } catch {
    return false;
  }
}

function extractText(payload: string): string {
  try {
    const parsed = JSON.parse(payload) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return (parsed.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('');
  } catch {
    return '';
  }
}

function parseRetryAfter(response: Response, body: string): number | undefined {
  const header = response.headers.get('retry-after');
  if (header && Number.isFinite(Number(header))) return Number(header);

  const match = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body);
  return match ? Math.ceil(Number(match[1])) : undefined;
}

// Con menos de 3072 dimensiones Gemini no normaliza los vectores: sin esto la similitud coseno falla.
function normalize(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return values;
  return values.map((value) => value / norm);
}
