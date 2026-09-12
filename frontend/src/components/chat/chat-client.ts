// Cliente que recibe en streaming las respuestas de PINKY.

import type { Locale } from '@blackpink/types';

export interface ChatAction {
  action: 'navigate' | 'open_section' | 'none';
  path: string | null;
  label: string | null;
}

export interface ChatCitation {
  label: string;
  path: string;
}

export type ChatStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'done'; action: ChatAction; citations: ChatCitation[] }
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

export async function* sendMessage(options: SendOptions): AsyncGenerator<ChatStreamEvent> {
  const response = await fetch(`${API}/api/v1/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: options.message,
      sessionId: options.sessionId,
      locale: options.locale,
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
          /* Un evento ilegible se ignora */
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

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

export interface Transcription {
  text: string;
  detectedLanguage: Locale;
  confidence: number;
  durationSec: number;
}

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

export async function transcribeAudio(blob: Blob, signal?: AbortSignal): Promise<Transcription> {
  const form = new FormData();
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
