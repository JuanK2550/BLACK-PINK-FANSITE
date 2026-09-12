// Detecta el idioma del mensaje.

import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';

const HANGUL = /[가-힯ᄀ-ᇿ㄰-㆏]/;

const SPANISH_CHARS = /[¿¡ñáéíóúü]/i;

const SPANISH_WORDS =
  /\b(que|como|cuando|donde|cual|cuales|quien|por|para|del|los|las|una|con|sobre|hay|tiene|tienen|cuantos|cuantas|album|cancion|integrante|dime|cuentame|muestrame)\b/;

const ENGLISH_WORDS =
  /\b(the|what|when|where|which|who|how|and|for|with|about|there|have|has|does|did|show|tell|many|much|song|album|member|you|your|are|is|was|can|could|would|please|give|want|know|all|this|that|previous|instructions|now|from|they|their)\b/;

export interface LanguageVerdict {
  locale: Locale;
  detected: boolean;
}

export function detectLanguage(message: string, fallback: Locale): LanguageVerdict {
  const text = message.toLowerCase();

  if (HANGUL.test(message)) return { locale: 'ko', detected: true };

  if (SPANISH_CHARS.test(message)) return { locale: 'es', detected: true };

  const spanish = countMatches(text, SPANISH_WORDS);
  const english = countMatches(text, ENGLISH_WORDS);

  if (spanish > english) return { locale: 'es', detected: true };
  if (english > spanish) return { locale: 'en', detected: true };

  return { locale: normalize(fallback), detected: false };
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(new RegExp(pattern.source, 'g')) ?? []).length;
}

function normalize(value: string): Locale {
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : 'en';
}
