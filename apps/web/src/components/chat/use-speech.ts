'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@blackpink/types';

/**
 * ============================================================================
 * QUE PINKY LEA SUS RESPUESTAS
 * ============================================================================
 * Con `speechSynthesis`, del propio navegador. No se manda nada a ningun sitio
 * para esto: el texto ya esta en pantalla y la voz la pone el sistema
 * operativo. Es la unica pieza de audio del proyecto que no cruza la red.
 *
 * APAGADA POR DEFECTO, y esto no es timidez. Una pagina que empieza a hablar
 * sola es de las cosas mas hostiles que puede hacer un sitio: interrumpe
 * musica, delata lo que alguien esta leyendo si hay gente cerca, y en un
 * movil con el volumen alto es una emboscada. Se enciende a mano y se
 * recuerda.
 *
 * ES UN EXTRA, NUNCA UN REQUISITO. El texto se pinta igual, y si el navegador
 * no tiene voces -o no tiene la del idioma- no pasa nada mas que no sonar.
 *
 * SE CORTA AL INSTANTE. Si llega otro mensaje o se silencia, `cancel()`. Una
 * voz que sigue leyendo una respuesta que ya no esta en pantalla es peor que
 * no tener voz.
 * ============================================================================
 */

const ENABLED_KEY = 'bp-chat-voice';

export interface UseSpeech {
  /** Hay voces y se puede hablar. */
  supported: boolean;
  enabled: boolean;
  /** Esta sonando ahora mismo. Es lo que pone a PINKY en `speaking`. */
  speaking: boolean;
  toggle: () => void;
  /** Lee un texto. No hace nada si esta apagada. */
  speak: (text: string, locale: Locale) => void;
  /** Corta al instante. */
  stop: () => void;
}

/** Prefijos de voz por idioma del sitio. */
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
      /* sin almacenamiento: se queda apagada, que es el defecto seguro */
    }

    /*
     * Las voces llegan TARDE y de forma asincrona. En Chrome la primera
     * llamada a `getVoices()` devuelve una lista vacia y solo despues se
     * dispara `voiceschanged`. Sin escuchar ese evento, la primera respuesta
     * se leeria con la voz por defecto del sistema -que puede ser de otro
     * idioma- y las siguientes ya no.
     */
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      // Al desmontar el panel, la voz se calla. Seguir leyendo una
      // conversacion cerrada seria de casa encantada.
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
      // Al silenciar se corta lo que este sonando, no se espera a que acabe.
      if (!next) stop();
      try {
        localStorage.setItem(ENABLED_KEY, next ? '1' : '0');
      } catch {
        /* sin persistencia: como mucho hay que volver a encenderla */
      }
      return next;
    });
  }, [stop]);

  const speak = useCallback(
    (text: string, locale: Locale) => {
      if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      const clean = text.trim();
      if (clean.length === 0) return;

      // Lo que estuviera sonando se corta: nunca dos respuestas a la vez.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(clean);

      /*
       * Voz del idioma detectado, con respaldo.
       *
       * Se busca por prefijo (`es`) y no por etiqueta completa (`es-ES`): un
       * navegador puede traer `es-MX` y ninguna `es-ES`, y exigir la exacta
       * dejaria sin voz a media America.
       *
       * Si no hay ninguna del idioma, se deja que el navegador elija: leera
       * con acento raro, que es peor que bien pero mejor que el silencio.
       */
      const prefix = VOICE_PREFIX[locale];
      const voice = voicesRef.current.find((candidate) => candidate.lang.startsWith(prefix));

      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? `${prefix}-${prefix.toUpperCase()}`;
      // Un pelo mas rapida que el habla por defecto: la del sistema suena
      // lenta leyendo dos frases.
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
