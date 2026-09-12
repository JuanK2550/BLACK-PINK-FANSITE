// Revisa cada mensaje antes y después del modelo.

import { Injectable } from '@nestjs/common';
import type { Locale } from '@blackpink/types';
import { AuditService } from './audit.service';
import { detectInjection } from './injection';
import { detectLanguage } from './language';
import { moderate, type ModerationCategory } from './moderation';
import { sanitizeInput } from './sanitize';

export interface InputVerdict {
  message: string;
  locale: Locale;
  localeDetected: boolean;
  refusal: { text: string; kind: string } | null;
}

@Injectable()
export class SafetyService {
  constructor(private readonly audit: AuditService) {}

  checkInput(raw: string, uiLocale: Locale, sessionId: string): InputVerdict {
    const message = sanitizeInput(raw);
    const { locale, detected } = detectLanguage(message, uiLocale);

    const base = { message, locale, localeDetected: detected };

    const injection = detectInjection(message);
    if (injection.blocked) {
      this.audit.record({
        phase: 'input',
        kind: 'injection',
        rules: injection.rules,
        locale,
        messageLength: message.length,
        sessionId,
        message,
      });

      return {
        ...base,
        refusal: { text: refusalFor('injection', locale), kind: 'injection' },
      };
    }

    const content = moderate(message);
    if (content.blocked) {
      this.audit.record({
        phase: 'input',
        kind: content.category!,
        rules: [content.ruleId!],
        locale,
        messageLength: message.length,
        sessionId,
        message,
      });

      return {
        ...base,
        refusal: { text: refusalFor(content.category!, locale), kind: content.category! },
      };
    }

    return { ...base, refusal: null };
  }

  checkOutput(text: string, locale: Locale, sessionId: string): { blocked: boolean; text: string } {
    const verdict = moderate(text);
    if (!verdict.blocked) return { blocked: false, text };

    this.audit.record({
      phase: 'output',
      kind: verdict.category!,
      rules: [verdict.ruleId!],
      locale,
      messageLength: text.length,
      sessionId,
      message: text,
    });

    return { blocked: true, text: refusalFor(verdict.category!, locale) };
  }
}

type RefusalKind = 'injection' | ModerationCategory;

const REFUSALS: Record<RefusalKind, Record<Locale, string>> = {
  injection: {
    es: 'Eso no puedo hacerlo: no comparto mis instrucciones ni cambio de papel. Pero pregúntame lo que quieras sobre BLACKPINK y el contenido del sitio.',
    en: "I can't do that: I don't share my instructions or switch roles. But ask me anything about BLACKPINK and what's on the site.",
    ko: '그건 도와드릴 수 없어요. 제 지시문을 공유하거나 역할을 바꾸지는 않습니다. 대신 BLACKPINK와 사이트 내용에 대해 무엇이든 물어보세요!',
  },
  sexual: {
    es: 'No voy a hablar de eso. Puedo contarte lo que quieras sobre su música, su carrera y el contenido del sitio.',
    en: "I won't go there. I can tell you about their music, their career and what's on the site.",
    ko: '그 주제는 다루지 않아요. 대신 음악과 활동, 사이트에 있는 내용은 얼마든지 알려드릴게요.',
  },
  hate: {
    es: 'No voy a participar en eso. Si te apetece, seguimos hablando de música.',
    en: "I won't take part in that. If you like, we can keep talking about music.",
    ko: '그런 이야기에는 참여하지 않을게요. 괜찮으시다면 음악 이야기를 이어가요.',
  },
  harassment: {
    es: 'No escribo mensajes para atacar a nadie. Pregúntame otra cosa y te ayudo encantada.',
    en: "I don't write messages meant to attack anyone. Ask me something else and I'm happy to help.",
    ko: '누군가를 공격하는 글은 쓰지 않아요. 다른 것을 물어보시면 기꺼이 도와드릴게요.',
  },
  'private-life': {
    es: 'Sobre su vida privada no especulo: este sitio solo publica lo que está contrastado. Lo que sí tengo es su discografía, su cronología y sus premios.',
    en: "I don't speculate about their private lives: this site only publishes what has been verified. What I do have is their discography, timeline and awards.",
    ko: '사생활에 대해서는 추측하지 않아요. 이 사이트는 확인된 내용만 공개합니다. 디스코그래피와 연표, 수상 내역은 알려드릴 수 있어요.',
  },
};

function refusalFor(kind: RefusalKind, locale: Locale): string {
  return REFUSALS[kind][locale] ?? REFUSALS[kind].en;
}
