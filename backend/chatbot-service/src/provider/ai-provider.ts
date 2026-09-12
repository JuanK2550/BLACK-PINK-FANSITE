// Interfaz común para cualquier proveedor de IA.

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface ChatRequest {
  system: string;
  history: ChatTurn[];
  message: string;
}

export interface EmbedRequest {
  texts: string[];
  purpose: 'document' | 'query';
}

export interface AiProvider {
  describe(): string;

  isConfigured(): boolean;

  streamChat(request: ChatRequest, signal?: AbortSignal): AsyncIterable<string>;

  embed(request: EmbedRequest): Promise<number[][]>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export type AiErrorKind = 'not_configured' | 'quota' | 'upstream' | 'aborted';

export class AiError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    message: string,
    readonly retryAfterSec?: number,
  ) {
    super(message);
    this.name = 'AiError';
  }
}
