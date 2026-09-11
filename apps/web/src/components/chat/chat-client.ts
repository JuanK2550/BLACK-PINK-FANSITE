import type { Locale } from '@blackpink/types';

/**
 * ============================================================================
 * CLIENTE DEL STREAM DE PINKY
 * ============================================================================
 * Habla con el gateway, nunca con chatbot-service: el navegador solo conoce el
 * puerto 4000.
 *
 * NO SE USA `EventSource`, aunque esto sea SSE. EventSource solo hace GET, y el
 * mensaje mas el historial no caben con dignidad en una URL: acabarian escritos
 * en los logs de cualquier intermediario. Se usa `fetch` con `ReadableStream`,
 * que ademas permite cancelar de verdad.
 * ============================================================================
 */

export interface ChatAction {
  action: 'navigate' | 'open_section' | 'none';
  path: string | null;
  label: string | null;
}

export interface ChatCitation {
  label: string;
  path: string;
}

/** Los mismos eventos que emite el servicio, sin traducir. */
export type ChatStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'done'; action: ChatAction; citations: ChatCitation[] }
  /**
   * CONTRATO DE LA FASE 9: al recibir esto, el cliente DESCARTA todo lo ya
   * pintado de esa respuesta y muestra unicamente `text`.
   *
   * Existe porque con streaming lo ya enviado no se puede retirar: si el
   * filtro de salida detecta algo a mitad de la respuesta, el servidor corta y
   * avisa. Ignorarlo dejaria en pantalla justo el fragmento que el servicio
   * decidio que no debia mostrarse.
   */
  | { type: 'blocked'; text: string }
  | { type: 'error'; code: string; message: string };

export interface SendOptions {
  message: string;
  sessionId: string;
  locale: Locale;
  history: { role: 'user' | 'model'; text: string }[];
  signal?: AbortSignal;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Envia un mensaje y devuelve los eventos segun llegan.
 *
 * Es un generador: quien lo consume decide que hacer con cada evento y no hay
 * que pasarle media docena de callbacks.
 */
export async function* sendMessage(options: SendOptions): AsyncGenerator<ChatStreamEvent> {
  const response = await fetch(`${API}/api/v1/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: options.message,
      sessionId: options.sessionId,
      locale: options.locale,
      // Se envian los ultimos turnos, no la conversacion entera: mas historia
      // es mas cuota por pregunta y el servicio la recorta igualmente.
      history: options.history.slice(-8),
    }),
    signal: options.signal,
  });

  if (!response.ok && response.status !== 201) {
    yield {
      type: 'error',
      code: String(response.status),
      message: response.status === 429 ? 'RATE_LIMIT' : 'UPSTREAM',
    };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      /*
       * Se corta por linea completa. Un evento SSE puede partirse entre dos
       * lecturas del socket, asi que trocear por lo recibido en vez de por
       * linea produce JSON a medias de vez en cuando: un fallo intermitente
       * que solo aparece con la red lenta.
       */
      let newline = buffer.indexOf('\n');
      while (newline !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf('\n');

        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;

        try {
          yield JSON.parse(payload) as ChatStreamEvent;
        } catch {
          // Un evento ilegible se ignora: el resto de la respuesta sirve.
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

/** Preguntas sugeridas. Si fallan, el chat sigue siendo usable. */
export async function fetchSuggestions(locale: Locale): Promise<string[]> {
  try {
    const response = await fetch(`${API}/api/v1/chat/suggestions?locale=${locale}`);
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: { suggestions?: string[] } };
    return body.data?.suggestions ?? [];
  } catch {
    return [];
  }
}

/* ========================================================================== */
/*  TRANSCRIPCION                                                             */
/* ========================================================================== */

export interface Transcription {
  text: string;
  detectedLanguage: Locale;
  /** 0 a 1. Estimacion del proveedor, no una certeza. Ver speech-service. */
  confidence: number;
  durationSec: number;
}

/**
 * Codigos que devuelve speech-service. El cliente ramifica por ellos y NO por
 * el mensaje: el mensaje esta en castellano y la interfaz habla tres idiomas.
 */
export type TranscribeErrorCode =
  | 'EMPTY_AUDIO'
  | 'UNSUPPORTED_FORMAT'
  | 'AUDIO_TOO_LARGE'
  | 'AUDIO_TOO_LONG'
  | 'ASR_QUOTA'
  | 'SPEECH_RATE_LIMIT'
  | 'ASR_NOT_CONFIGURED'
  | 'ASR_UNAVAILABLE';

export class TranscribeError extends Error {
  constructor(readonly code: TranscribeErrorCode) {
    super(code);
    this.name = 'TranscribeError';
  }
}

/**
 * Manda un audio y devuelve el texto.
 *
 * EL AUDIO VA AL GATEWAY, igual que todo lo demas: el navegador no conoce el
 * puerto de speech-service ni la clave de Groq, que no sale nunca del backend.
 *
 * No se pasa `language`: forzar el idioma equivocado no da error, da una
 * transcripcion plausible y falsa. Lo detecta el modelo.
 */
export async function transcribeAudio(blob: Blob, signal?: AbortSignal): Promise<Transcription> {
  const form = new FormData();
  // El nombre lleva la extension que corresponde al tipo real del Blob, que en
  // una grabacion lo pone MediaRecorder. El servidor lo reescribe de todas
  // formas segun los bytes: esto es solo para que el multipart sea valido.
  form.append('audio', blob, `grabacion.${extensionFor(blob.type)}`);

  let response: Response;
  try {
    response = await fetch(`${API}/api/v1/transcribe`, {
      method: 'POST',
      body: form,
      signal,
    });
  } catch {
    throw new TranscribeError('ASR_UNAVAILABLE');
  }

  const payload = (await response.json().catch(() => null)) as {
    data?: Transcription;
    error?: { code?: string };
  } | null;

  if (!response.ok || !payload?.data) {
    const code = payload?.error?.code;
    throw new TranscribeError(isKnownCode(code) ? code : 'ASR_UNAVAILABLE');
  }

  return payload.data;
}

const KNOWN_CODES: TranscribeErrorCode[] = [
  'EMPTY_AUDIO',
  'UNSUPPORTED_FORMAT',
  'AUDIO_TOO_LARGE',
  'AUDIO_TOO_LONG',
  'ASR_QUOTA',
  'SPEECH_RATE_LIMIT',
  'ASR_NOT_CONFIGURED',
  'ASR_UNAVAILABLE',
];

function isKnownCode(code: string | undefined): code is TranscribeErrorCode {
  return code !== undefined && (KNOWN_CODES as string[]).includes(code);
}

/** `audio/webm;codecs=opus` -> `webm`. */
function extensionFor(mime: string): string {
  const base = mime.split(';')[0]?.trim() ?? '';
  const map: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/wave': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
  };
  return map[base] ?? 'webm';
}
