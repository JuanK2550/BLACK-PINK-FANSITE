'use client';

import { useEffect, useRef, useState } from 'react';
import { PINKY_GESTURES, PinkyLion, type PinkyGesture } from './pinky-lion';
import type { PinkyState } from './pinky-avatar';

/**
 * ============================================================================
 * LA CUADRICULA DEL LABORATORIO
 * ============================================================================
 * Cinco estados por tres tamanos, todos a la vez y todos animandose. Verlos
 * juntos es el punto: un estado se juzga por lo que lo diferencia de los otros
 * cuatro, y de uno en uno esa comparacion hay que hacerla de memoria.
 *
 * Y OCHO BOTONES, uno por gesto. Sin ellos, revisar el bostezo significa
 * abrir el chat y esperar hasta quince segundos a que salga por sorteo -y que
 * salga justo ese-. Con ellos se ve al instante y se puede repetir hasta que
 * el tiempo quede bien, que es como se ajusta una animacion.
 *
 * Los tres tamanos son los REALES del producto, no una escala bonita: 84px es
 * la burbuja flotante, 56px la cabecera del panel, y 220px existe para ver
 * donde falla un trazo antes de que se note a 56.
 * ============================================================================
 */

const STATES: PinkyState[] = ['idle', 'greeting', 'listening', 'thinking', 'speaking'];

const SIZES: { label: string; where: string; px: number }[] = [
  { label: '220px', where: 'inspeccion', px: 220 },
  { label: '84px', where: 'burbuja flotante', px: 84 },
  { label: '56px', where: 'cabecera del panel', px: 56 },
];

/** Lo que dura el gesto mas largo, con margen. Igual que en el hook. */
const GESTURE_MS = 3200;

/** La proporcion del viewBox: 172 de ancho por 214 de alto. */
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

  /**
   * El `null` intermedio es obligatorio para poder repetir el MISMO gesto:
   * sin cambio de atributo, el navegador no reinicia la animacion y el segundo
   * clic no hace nada. Y repetir es justo lo que se hace al ajustar tiempos.
   */
  function play(next: PinkyGesture) {
    if (timer.current) clearTimeout(timer.current);
    setGesture(null);
    // `setTimeout` y no `requestAnimationFrame`: rAF no corre con la ventana
    // en segundo plano, y este boton tiene que funcionar tambien cuando se
    // esta revisando la pagina desde fuera.
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

        {/* --------------------------------------------------------- gestos */}
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
                    {/* La caja lleva la proporcion del viewBox para que el alto
                        sea el que se pide y el ancho salga solo, igual que en
                        la burbuja y en la cabecera. */}
                    <div style={{ height: size.px, width: Math.round(size.px * RATIO) }}>
                      <PinkyLion
                        state={state}
                        // El gesto solo se aplica al reposo, igual que en el
                        // sitio: fuera de ahi manda el estado.
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
