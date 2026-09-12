// Transcripción con Whisper (Groq u OpenAI).

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';
import {
  AsrError,
  type AsrProvider,
  type TranscribeRequest,
  type TranscribeResult,
} from './asr-provider';

const BASE_URLS: Record<string, string> = {
  groq: 'https://api.groq.com/openai/v1',
  openai: 'https://api.openai.com/v1',
};

const DEFAULT_MODELS: Record<string, string> = {
  groq: 'whisper-large-v3',
  openai: 'whisper-1',
};

const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 1000;

const TIMEOUT_MS = 45_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface VerboseJson {
  text?: string;
  language?: string;
  duration?: number;
  segments?: { avg_logprob?: number; no_speech_prob?: number; end?: number; start?: number }[];
}

@Injectable()
export class WhisperProvider implements AsrProvider {
  private readonly logger = new Logger(WhisperProvider.name);

  private readonly vendor: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.vendor = (config.get<string>('WHISPER_PROVIDER')?.trim() || 'groq').toLowerCase();
    this.baseUrl = BASE_URLS[this.vendor] ?? BASE_URLS.groq!;

    const vendorKey = this.vendor === 'openai' ? 'OPENAI_API_KEY' : 'GROQ_API_KEY';
    this.apiKey =
      config.get<string>(vendorKey)?.trim() || config.get<string>('ASR_API_KEY')?.trim() || '';

    this.model =
      config.get<string>('WHISPER_MODEL')?.trim() ||
      config.get<string>('ASR_MODEL')?.trim() ||
      DEFAULT_MODELS[this.vendor] ||
      DEFAULT_MODELS.groq!;

    if (!this.isConfigured()) {
      this.logger.warn(
        `${vendorKey} vacia: /transcribe respondera 503. Ver README, seccion "Voz".`,
      );
    }
  }

  describe(): string {
    return `${this.vendor}(${this.model})`;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async transcribe(request: TranscribeRequest, signal?: AbortSignal): Promise<TranscribeResult> {
    if (!this.isConfigured()) {
      throw new AsrError('not_configured', 'No hay clave del proveedor de transcripcion.');
    }

    const payload = await this.post(request, signal);

    const text = (payload.text ?? '').trim();
    if (text.length === 0) {
      throw new AsrError('empty_audio', 'El audio no contiene voz reconocible.');
    }

    return {
      text,
      detectedLanguage: normalizeLocale(payload.language),
      confidence: confidenceFrom(payload),
      durationSec: Math.round((payload.duration ?? 0) * 10) / 10,
    };
  }

  private async post(request: TranscribeRequest, signal?: AbortSignal): Promise<VerboseJson> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const onAbort = () => controller.abort();
      signal?.addEventListener('abort', onAbort, { once: true });
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const form = new FormData();
        form.append(
          'file',
          new Blob([request.audio], { type: request.mimeType }),
          request.filename,
        );
        form.append('model', this.model);
        form.append('response_format', 'verbose_json');
        form.append('temperature', '0');
        if (request.language) form.append('language', request.language);

        const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
          method: 'POST',
          headers: { authorization: `Bearer ${this.apiKey}` },
          body: form,
          signal: controller.signal,
        });

        if (response.ok) return (await response.json()) as VerboseJson;

        const retryable = response.status === 429 || response.status >= 500;
        const detail = await response.text().catch(() => '');

        if (!retryable) {
          if (response.status === 401 || response.status === 403) {
            throw new AsrError('not_configured', 'La clave del proveedor no es valida.');
          }
          throw new AsrError('upstream', `El proveedor rechazo el audio (${response.status}).`);
        }

        if (attempt === MAX_ATTEMPTS) {
          const retryAfter = retryAfterSeconds(response);
          if (response.status === 429) {
            throw new AsrError('quota', 'Cuota de transcripcion agotada.', retryAfter);
          }
          throw new AsrError('upstream', `El proveedor no responde (${response.status}).`);
        }

        const wait =
          (retryAfterSeconds(response) ?? 0) * 1000 || BASE_DELAY_MS * 2 ** (attempt - 1);
        this.logger.warn(
          `intento ${attempt}/${MAX_ATTEMPTS} fallido (${response.status}), ` +
            `reintento en ${wait}ms${detail ? `: ${detail.slice(0, 160)}` : ''}`,
        );
        await sleep(wait);
        lastError = new AsrError('upstream', `HTTP ${response.status}`);
      } catch (error) {
        if (error instanceof AsrError) throw error;

        if (controller.signal.aborted) {
          if (signal?.aborted) throw new AsrError('aborted', 'Transcripcion cancelada.');
          throw new AsrError('upstream', 'El proveedor tardo demasiado.');
        }

        lastError = error;
        if (attempt === MAX_ATTEMPTS) break;
        await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
      }
    }

    throw new AsrError('upstream', `No se pudo contactar con el proveedor: ${String(lastError)}`);
  }
}

function retryAfterSeconds(response: Response): number | undefined {
  const raw = response.headers.get('retry-after');
  if (!raw) return undefined;
  const seconds = Number(raw);
  return Number.isFinite(seconds) ? Math.ceil(seconds) : undefined;
}

const LANGUAGE_NAMES: Record<string, Locale> = {
  spanish: 'es',
  castilian: 'es',
  english: 'en',
  korean: 'ko',
};

// Groq devuelve el idioma como nombre ("Spanish"), no como código ("es").
export function normalizeLocale(raw: string | undefined): Locale {
  if (!raw) return 'en';

  const value = raw.trim().toLowerCase();

  const base = value.split(/[-_]/)[0]!;
  if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) return base as Locale;

  return LANGUAGE_NAMES[value] ?? 'en';
}

export function confidenceFrom(payload: VerboseJson): number {
  const segments = payload.segments ?? [];
  if (segments.length === 0) return 0;

  let weighted = 0;
  let total = 0;

  for (const segment of segments) {
    const span = Math.max(0.1, (segment.end ?? 0) - (segment.start ?? 0));
    const probability = Math.exp(segment.avg_logprob ?? -1);
    const speech = 1 - (segment.no_speech_prob ?? 0);

    weighted += probability * speech * span;
    total += span;
  }

  if (total === 0) return 0;
  return Math.min(1, Math.max(0, Math.round((weighted / total) * 100) / 100));
}
