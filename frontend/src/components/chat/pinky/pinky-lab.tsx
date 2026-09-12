// Cuadrícula con los estados y gestos de PINKY.
'use client';

import { useEffect, useRef, useState } from 'react';
import { PINKY_GESTURES, PinkyLion, type PinkyGesture } from './pinky-lion';
import type { PinkyState } from './pinky-lion';

const STATES: PinkyState[] = ['idle', 'greeting', 'listening', 'thinking', 'speaking'];

const SIZES: { label: string; where: string; px: number }[] = [
  { label: '220px', where: 'inspeccion', px: 220 },
  { label: '84px', where: 'burbuja flotante', px: 84 },
  { label: '56px', where: 'cabecera del panel', px: 56 },
];

const GESTURE_MS = 3200;

const RATIO = 172 / 214;

export function PinkyLab() {
  const [reduced, setReduced] = useState(false);
  const [surface, setSurface] = useState<'canvas' | 'overlay'>('overlay');
  const [gesture, setGesture] = useState<PinkyGesture | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function play(next: PinkyGesture) {
    if (timer.current) clearTimeout(timer.current);
    setGesture(null);
    setTimeout(() => {
      setGesture(next);
      timer.current = setTimeout(() => setGesture(null), GESTURE_MS);
    }, 20);
  }

  const chip =
    'border-line text-fg-muted hover:border-accent hover:text-accent-text focus-visible:outline-focus ease-out-bp rounded-full border px-3 py-1.5 text-xs transition-colors duration-[var(--dur-2)] focus-visible:outline-2 active:scale-[0.97]';

  return (
    <main className="bg-canvas min-h-dvh px-6 py-10 sm:px-10">
      <header className="border-line mb-10 border-b pb-6">
        <h1 className="font-display text-fg text-2xl font-bold">PINKY · laboratorio</h1>
        <p className="text-fg-muted mt-1 max-w-prose text-sm">
          Cinco estados, tres tamanos y ocho gestos. Herramienta interna: no indexada, sin enlaces
          entrantes.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setReduced((value) => !value)}
            aria-pressed={reduced}
            className={`${chip} aria-pressed:border-accent aria-pressed:text-accent-text`}
          >
            prefers-reduced-motion
          </button>

          <button
            type="button"
            onClick={() => setSurface((value) => (value === 'overlay' ? 'canvas' : 'overlay'))}
            className={chip}
          >
            fondo: {surface}
          </button>
        </div>

        <h2 className="text-fg-subtle text-2xs mt-6 uppercase">
          gestos · se disparan sobre la fila de reposo
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {PINKY_GESTURES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => play(name)}
              aria-pressed={gesture === name}
              className={`${chip} aria-pressed:border-accent aria-pressed:text-accent-text`}
            >
              {name}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-12">
        {SIZES.map((size) => (
          <section key={size.label}>
            <h2 className="text-fg-subtle text-2xs mb-4 uppercase">
              {size.label} · {size.where}
            </h2>

            <ul className="flex flex-wrap items-end gap-5">
              {STATES.map((state) => (
                <li key={state} className="flex flex-col items-center gap-2">
                  <div
                    className={[
                      'border-line grid place-items-center rounded-md border p-3',
                      surface === 'overlay' ? 'bg-overlay' : 'bg-canvas',
                    ].join(' ')}
                  >
                    <div style={{ height: size.px, width: Math.round(size.px * RATIO) }}>
                      <PinkyLion
                        state={state}
                        gesture={state === 'idle' ? gesture : null}
                        reducedMotion={reduced}
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                  <span className="text-fg-subtle text-2xs">{state}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
