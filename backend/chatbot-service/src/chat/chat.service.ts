// Responde una pregunta: filtra, busca contexto y llama al modelo.

import { Inject, Injectable, Logger } from '@nestjs/common';
import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';
import { AI_PROVIDER, AiError, type AiProvider, type ChatTurn } from '../provider/ai-provider';
import { RetrievalService } from '../rag/retrieval.service';
import { VectorStoreService } from '../rag/vector-store.service';
import { SafetyService } from '../safety/safety.service';
import { newContextFence } from '../safety/sanitize';
import { buildSystemPrompt, splitAction } from './prompt';
import { NO_ACTION, resolveAction, type ChatAction, type KnownTarget } from './sitemap';

export interface ChatCitation {
  label: string;
  path: string;
}

export type ChatEvent =
  | { type: 'token'; text: string }
  | { type: 'done'; action: ChatAction; citations: ChatCitation[] }
  | { type: 'blocked'; text: string }
  | { type: 'error'; code: string; message: string };

const FALLBACK_LOCALE: Locale = 'en';

const MARKER = 'ACCION:';

const MESSAGES: Record<Locale, { quota: string; unavailable: string; generic: string }> = {
  es: {
    quota:
      'Ahora mismo he agotado mi cuota de preguntas del dia. Vuelve a intentarlo en un rato: mientras tanto puedes seguir explorando el sitio.',
    unavailable:
      'Mi cerebro no esta configurado todavia en este sitio, asi que no puedo responder. El contenido esta igualmente disponible en las paginas.',
    generic: 'Me he encontrado con un problema al responder. Intentalo otra vez en un momento.',
  },
  en: {
    quota:
      "I've used up my question quota for now. Try again in a little while: you can keep exploring the site meanwhile.",
    unavailable:
      'My brain is not configured on this site yet, so I cannot answer. The content is still available on the pages.',
    generic: 'I ran into a problem answering that. Please try again in a moment.',
  },
  ko: {
    quota:
      '지금은 질문 한도를 다 써버렸어요. 잠시 뒤에 다시 시도해 주세요. 그동안 사이트를 둘러보셔도 좋아요.',
    unavailable:
      '이 사이트에서는 아직 제 두뇌가 설정되지 않아 답변할 수 없어요. 내용은 각 페이지에서 확인하실 수 있습니다.',
    generic: '답변하는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
  },
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
    private readonly retrieval: RetrievalService,
    private readonly store: VectorStoreService,
    private readonly safety: SafetyService,
  ) {}

  async *answer(
    raw: string,
    uiLocale: Locale,
    history: ChatTurn[],
    signal?: AbortSignal,
    sessionId = '',
  ): AsyncIterable<ChatEvent> {
    const check = this.safety.checkInput(raw, uiLocale, sessionId);
    const locale = check.locale;
    const message = check.message;
    const texts = MESSAGES[locale] ?? MESSAGES[FALLBACK_LOCALE];

    if (check.refusal) {
      yield { type: 'token', text: check.refusal.text };
      yield { type: 'done', action: NO_ACTION, citations: [] };
      return;
    }

    if (!this.ai.isConfigured()) {
      yield { type: 'error', code: 'NOT_CONFIGURED', message: texts.unavailable };
      return;
    }

    let context = '';
    let citations: ChatCitation[] = [];
    let known: KnownTarget[] = [];

    try {
      const chunks = await this.retrieval.retrieve(message, locale);
      context = this.retrieval.format(chunks);

      const seen = new Set<string>();
      citations = chunks
        .filter((chunk) => !seen.has(chunk.sourcePath) && seen.add(chunk.sourcePath))
        .map((chunk) => ({ label: chunk.sourceLabel, path: `/${locale}${chunk.sourcePath}` }));

      known = citations.map((cite) => ({
        path: cite.path.replace(`/${locale}`, ''),
        label: cite.label,
      }));
    } catch (error) {
      if (error instanceof AiError && error.kind === 'quota') {
        yield { type: 'error', code: 'QUOTA', message: texts.quota };
        return;
      }
      this.logger.warn(`Recuperacion fallida: ${String(error)}`);
    }

    const system = buildSystemPrompt(locale, context, newContextFence());
    let full = '';
    let emitted = 0;

    try {
      for await (const piece of this.ai.streamChat(
        { system, history: history.slice(-10), message },
        signal,
      )) {
        full += piece;

        const marker = full.indexOf(MARKER);
        const safeEnd =
          marker === -1
            ? Math.max(emitted, full.length - (MARKER.length - 1))
            : full.slice(0, marker).trimEnd().length;

        if (safeEnd > emitted) {
          const guard = this.safety.checkOutput(full.slice(0, safeEnd), locale, sessionId);
          if (guard.blocked) {
            yield { type: 'blocked', text: guard.text };
            return;
          }

          yield { type: 'token', text: full.slice(emitted, safeEnd) };
          emitted = safeEnd;
        }
      }

      const marker = full.indexOf(MARKER);
      const end = marker === -1 ? full.length : full.slice(0, marker).trimEnd().length;
      if (end > emitted) {
        yield { type: 'token', text: full.slice(emitted, end) };
      }
    } catch (error) {
      if (error instanceof AiError && error.kind === 'quota') {
        yield { type: 'error', code: 'QUOTA', message: texts.quota };
        return;
      }
      if (error instanceof AiError && error.kind === 'aborted') return;

      this.logger.warn(`Generacion fallida: ${String(error)}`);
      yield { type: 'error', code: 'UPSTREAM', message: texts.generic };
      return;
    }

    const finalGuard = this.safety.checkOutput(full, locale, sessionId);
    if (finalGuard.blocked) {
      yield { type: 'blocked', text: finalGuard.text };
      return;
    }

    const { raw: marker } = splitAction(full);
    const action = resolveAction(marker, locale, known);

    yield {
      type: 'done',
      action,
      citations: context ? citations.slice(0, 3) : [],
    };
  }

  suggestions(locale: Locale): string[] {
    const all: Record<Locale, string[]> = {
      es: [
        '¿Cuándo debutó BLACKPINK?',
        '¿Qué canciones tiene BORN PINK?',
        '¿Qué premios han ganado?',
        'Cuéntame algo de Rosé',
        '¿Dónde veo la cronología?',
      ],
      en: [
        'When did BLACKPINK debut?',
        'What songs are on BORN PINK?',
        'Which awards have they won?',
        'Tell me something about Rosé',
        'Where can I see the timeline?',
      ],
      ko: [
        'BLACKPINK는 언제 데뷔했나요?',
        'BORN PINK에는 어떤 곡이 있나요?',
        '어떤 상을 받았나요?',
        '로제에 대해 알려주세요',
        '연표는 어디에서 볼 수 있나요?',
      ],
    };

    return all[locale] ?? all[FALLBACK_LOCALE];
  }

  async indexStatus(): Promise<{ provider: string; configured: boolean; chunks: number }> {
    let chunks = 0;
    try {
      chunks = await this.store.count();
    } catch {
      chunks = -1;
    }

    return {
      provider: this.ai.describe(),
      configured: this.ai.isConfigured(),
      chunks,
    };
  }
}

export function resolveLocale(value: string | undefined): Locale {
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : FALLBACK_LOCALE;
}
