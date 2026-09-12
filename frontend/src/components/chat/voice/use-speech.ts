// Lee en voz alta las respuestas con la voz del navegador.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@blackpink/types';

const ENABLED_KEY = 'bp-chat-voice';

export interface UseSpeech {
  supported: boolean;
  enabled: boolean;
  speaking: boolean;
  toggle: () => void;
  speak: (text: string, locale: Locale) => void;
  stop: () => void;
}

const VOICE_PREFIX: Record<Locale, string> = { es: 'es', en: 'en', ko: 'ko' };

export function useSpeech(): UseSpeech {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    setSupported(true);

    try {
      setEnabled(localStorage.getItem(ENABLED_KEY) === '1');
    } catch {
      /* sin almacenamiento */
    }

    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((previous) => {
      const next = !previous;
      if (!next) stop();
      try {
        localStorage.setItem(ENABLED_KEY, next ? '1' : '0');
      } catch {
        /* sin persistencia */
      }
      return next;
    });
  }, [stop]);

  const speak = useCallback(
    (text: string, locale: Locale) => {
      if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      const clean = text.trim();
      if (clean.length === 0) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(clean);

      const prefix = VOICE_PREFIX[locale];
      const voice = voicesRef.current.find((candidate) => candidate.lang.startsWith(prefix));

      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? `${prefix}-${prefix.toUpperCase()}`;
      utterance.rate = 1.05;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [enabled],
  );

  return { supported, enabled, speaking, toggle, speak, stop };
}
