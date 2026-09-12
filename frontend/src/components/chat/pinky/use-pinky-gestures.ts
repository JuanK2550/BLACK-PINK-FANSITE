// Gestos espontáneos de PINKY mientras está en reposo.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PINKY_GESTURES, type PinkyGesture } from './pinky-lion';
import type { PinkyState } from './pinky-lion';

const MIN_GAP_MS = 8000;
const MAX_GAP_MS = 15000;

const GESTURE_MS = 3200;

export interface UsePinkyGestures {
  gesture: PinkyGesture | null;
  poke: () => void;
}

export function usePinkyGestures(state: PinkyState, reducedMotion: boolean): UsePinkyGestures {
  const [gesture, setGesture] = useState<PinkyGesture | null>(null);

  const lastRef = useRef<PinkyGesture | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pick = useCallback((): PinkyGesture => {
    const options = PINKY_GESTURES.filter((candidate) => candidate !== lastRef.current);
    const choice = options[Math.floor(Math.random() * options.length)]!;
    lastRef.current = choice;
    return choice;
  }, []);

  const play = useCallback((next: PinkyGesture) => {
    if (clearRef.current) clearTimeout(clearRef.current);

    setGesture(next);
    clearRef.current = setTimeout(() => setGesture(null), GESTURE_MS);
  }, []);

  const poke = useCallback(() => {
    if (reducedMotion) return;
    play(pick());
  }, [play, pick, reducedMotion]);

  useEffect(() => {
    if (state !== 'idle' || reducedMotion) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (clearRef.current) clearTimeout(clearRef.current);
      setGesture(null);
      return;
    }

    let alive = true;

    const schedule = () => {
      const gap = MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);

      timerRef.current = setTimeout(() => {
        if (!alive) return;
        play(pick());
        schedule();
      }, gap);
    };

    schedule();

    return () => {
      alive = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, reducedMotion, play, pick]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (clearRef.current) clearTimeout(clearRef.current);
    },
    [],
  );

  return { gesture, poke };
}
