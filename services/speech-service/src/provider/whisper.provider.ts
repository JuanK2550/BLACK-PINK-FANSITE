import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';
import {
  AsrError,
  type AsrProvider,
  type TranscribeRequest,
  type TranscribeResult,
} from './asr-provider';

/**
 * ============================================================================
 * WHISPER SOBRE UNA API COMPATIBLE CON OpenAI
 * ============================================================================
 * UNA sola clase para Groq y para OpenAI, porque los dos exponen exactamente
 * el mismo endpoint (`POST /audio/transcriptions`, multipart, mismos campos).
 * Lo unico que cambia es la URL base, la clave y el nombre del modelo, y las
 * tres son configuracion. Escribir dos clases identicas para cambiar una
 * cadena seria duplicar el mantenimiento sin ganar nada.
 *
 * `WHISPER_PROVIDER` elige: `groq` (por defecto) u `openai`.
 *
 * CUATRO COSAS QUE NO SON OBVIAS:
 *
 * 1. `verbose_json` NO ES UN LUJO. El formato `json` devuelve solo el texto:
 *    ni idioma detectado, ni duracion, ni segmentos. Sin el, `detectedLanguage`
 *    habria que adivinarlo y `confidence` seria inventada.
 *
 * 2. LA CUOTA DEL PLAN GRATUITO ES POR ORGANIZACION, NO POR CLAVE. Generar una
 *    clave nueva no da mas cuota. Un 429 se reintenta con espera exponencial
 *    respetando el `retry-after` que envia Groq, y si tras los reintentos
 *    sigue agotada se convierte en AsrError('quota'): la capa de arriba se lo
 *    explica al visitante en su idioma.
 *
 * 3. NO SE FUERZA EL IDIOMA salvo que el cliente lo pida explicitamente.
 *    Forzar el equivocado no da error: da una transcripcion plausible y falsa.
 *    Whisper con `language=es` y audio coreano no falla, transcribe el coreano
 *    fonéticamente en alfabeto latino. Es mejor que lo detecte el.
 *
 * 4. EL AUDIO NO SE ESCRIBE EN DISCO EN NINGUN MOMENTO. Llega en memoria desde
 *    multer, se monta el multipart en memoria y se descarta al volver. No hay
 *    fichero temporal que borrar porque no llega a existir: la unica forma
 *    segura de no dejar audio de nadie por ahi es no escribirlo nunca.
 * ============================================================================
 */

const BASE_URLS: Record<string, string> = {
  groq: 'https://api.groq.com/openai/v1',
  openai: 'https://api.openai.com/v1',
};

const DEFAULT_MODELS: Record<string, string> = {
  groq: 'whisper-large-v3',
  openai: 'whisper-1',
};

/** Reintentos ante 429/5xx. Cuatro intentos: ~1s, 2s, 4s. */
const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 1000;

/** Una peticion de 60s de audio no deberia tardar mas que esto. */
const TIMEOUT_MS = 45_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Lo que devuelve `response_format=verbose_json`. Solo lo que se usa. */
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

    /*
     * La clave concreta del proveedor manda sobre la generica.
     *
     * `ASR_API_KEY` existe desde la Fase 1 como nombre neutro; `GROQ_API_KEY`
     * es el que reconoce cualquiera que llegue de la documentacion de Groq.
     * Se aceptan los dos y gana el especifico: quien pega su clave en la
     * variable con el nombre del proveedor espera que se use esa.
     */
    const vendorKey = this.vendor === 'openai' ? 'OPENAI_API_KEY' : 'GROQ_API_KEY';
    this.apiKey =
      config.get<string>(vendorKey)?.trim() || config.get<string>('ASR_API_KEY')?.trim() || '';

    this.model =
      config.get<string>('WHISPER_MODEL')?.trim() ||
      config.get<string>('ASR_MODEL')?.trim() ||
      DEFAULT_MODELS[this.vendor] ||
      DEFAULT_MODELS.groq!;

    if (!this.isConfigured()) {
      // Aviso, no excepcion: el servicio arranca igual y /health responde. Lo
      // que no funciona es transcribir, y lo dice cuando se le pide.
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
      // No es un fallo: el proveedor acepto el audio y no oyo nada. Un
      // silencio, un microfono mudo o ruido de fondo acaban aqui.
      throw new AsrError('empty_audio', 'El audio no contiene voz reconocible.');
    }

    return {
      text,
      detectedLanguage: normalizeLocale(payload.language),
      confidence: confidenceFrom(payload),
      durationSec: Math.round((payload.duration ?? 0) * 10) / 10,
    };
  }

  /* ------------------------------------------------------------ interno --- */

  private async post(request: TranscribeRequest, signal?: AbortSignal): Promise<VerboseJson> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      // Un AbortController propio por intento, encadenado al del cliente: si
      // el visitante cancela, se corta; si tarda demasiado, tambien.
      const controller = new AbortController();
      const onAbort = () => controller.abort();
      signal?.addEventListener('abort', onAbort, { once: true });
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const form = new FormData();
        // El nombre del fichero importa: el proveedor elige el decodificador
        // por su extension. Sin ella, un webm valido se rechaza.
        form.append(
          'file',
          new Blob([request.audio], { type: request.mimeType }),
          request.filename,
        );
        form.append('model', this.model);
        form.append('response_format', 'verbose_json');
        // 0 = determinista. Una transcripcion no es una tarea creativa.
        form.append('temperature', '0');
        if (request.language) form.append('language', request.language);

        const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
          method: 'POST',
          // La clave va en la cabecera, nunca en la URL: con `?key=` acaba
          // escrita en los logs de cualquier proxy intermedio.
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

        // Se respeta lo que pide el proveedor cuando lo dice; si no, espera
        // exponencial. Reintentar antes de tiempo solo gasta cuota.
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
          // Distinguir quien aborto: el visitante cerro, o se agoto el tiempo.
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

/* ------------------------------------------------------------ ayudantes --- */

function retryAfterSeconds(response: Response): number | undefined {
  const raw = response.headers.get('retry-after');
  if (!raw) return undefined;
  const seconds = Number(raw);
  return Number.isFinite(seconds) ? Math.ceil(seconds) : undefined;
}

/**
 * El idioma del modelo, llevado a los tres del sitio.
 *
 * Whisper reconoce casi cien idiomas y aqui solo hay tres. Lo que llega puede
 * ser un codigo ISO (`ko`) o el nombre en ingles (`korean`), segun version y
 * proveedor: se aceptan los dos.
 *
 * SI NO ES NINGUNO DE LOS TRES, CAE AL INGLES y no al español. Es la misma
 * regla que usa `content-service` para el contenido sin traducir: entre los
 * tres idiomas del sitio, el ingles es la lengua franca. Y el texto
 * transcrito se conserva TAL CUAL en su idioma original: lo que cae al ingles
 * es la etiqueta con la que el chat decide en que idioma responder.
 */
const LANGUAGE_NAMES: Record<string, Locale> = {
  spanish: 'es',
  castilian: 'es',
  english: 'en',
  korean: 'ko',
};

export function normalizeLocale(raw: string | undefined): Locale {
  if (!raw) return 'en';

  const value = raw.trim().toLowerCase();

  // `es-ES`, `ko-KR`: el codigo de region no cambia el idioma.
  const base = value.split(/[-_]/)[0]!;
  if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) return base as Locale;

  return LANGUAGE_NAMES[value] ?? 'en';
}

/**
 * Confianza estimada, de 0 a 1.
 *
 * NO es una probabilidad calibrada y no se debe presentar como tal: Whisper no
 * publica una. Es `exp(avg_logprob)` -la probabilidad media por token que
 * declara cada segmento-, ponderada por la duracion del segmento, de modo que
 * un segmento largo y dudoso pesa mas que una interjeccion suelta.
 *
 * Se le resta ademas `no_speech_prob`: un segmento que el modelo cree que es
 * silencio produce texto igualmente -Whisper alucina frases enteras sobre
 * ruido de fondo- y esa es justo la transcripcion que conviene que el
 * visitante mire antes de enviar.
 *
 * Sin segmentos, 0. Preferimos decir «no lo se» a inventar un 0.9.
 */
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
