// Interfaz común para cualquier proveedor de transcripción.

import type { Locale } from '@blackpink/types';

export interface TranscribeRequest {
  audio: Buffer;
  filename: string;
  mimeType: string;
  language?: Locale;
}

export interface TranscribeResult {
  text: string;
  detectedLanguage: Locale;
  confidence: number;
  durationSec: number;
}

export interface AsrProvider {
  describe(): string;

  isConfigured(): boolean;

  transcribe(request: TranscribeRequest, signal?: AbortSignal): Promise<TranscribeResult>;
}

export const ASR_PROVIDER = Symbol('ASR_PROVIDER');

export type AsrErrorKind = 'not_configured' | 'quota' | 'upstream' | 'aborted' | 'empty_audio';

export class AsrError extends Error {
  constructor(
    readonly kind: AsrErrorKind,
    message: string,
    readonly retryAfterSec?: number,
  ) {
    super(message);
    this.name = 'AsrError';
  }
}
