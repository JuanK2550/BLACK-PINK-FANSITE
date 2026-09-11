'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PINKY_GESTURES, type PinkyGesture } from './pinky-lion';
import type { PinkyState } from './pinky-avatar';

/**
 * ============================================================================
 * LOS GESTOS ESPONTANEOS
 * ============================================================================
 * Es lo que separa un icono animado de algo que parece estar ahi. El bucle de
 * respiracion dice «esto no esta congelado»; un bostezo cada doce segundos
 * dice «esto tiene sus cosas».
 *
 * CINCO REGLAS, Y CADA UNA EVITA UN FALLO CONCRETO:
 *
 * 1. SOLO EN REPOSO. Mientras escucha, piensa o habla, manda el estado. Un
 *    leon que se pone a perseguirse la cola mientras alguien espera una
 *    respuesta no es simpatico, es que no te esta atendiendo.
 * 2. NUNCA DOS SEGUIDOS IGUALES. Dos bostezos consecutivos delatan que hay un
 *    dado detras, y en cuanto se ve el dado se acabo el personaje.
 * 3. ENTRE 8 Y 15 SEGUNDOS, y el intervalo se sortea cada vez. Fijo en diez,
 *    se vuelve predecible a la tercera vuelta.
 * 4. SE INTERRUMPEN AL INTERACTUAR. Si alguien escribe o abre la boca del
 *    microfono mientras el leon se rasca, el rascado se corta a media pata.
 *    Seguir con el gesto es ignorar a quien acaba de llegar.
 * 5. NADA CON `prefers-reduced-motion`. Ni se programan: no es que se apaguen
 *    al llegar, es que no se llega a poner el temporizador.
 *
 * Y SE PUEDEN PROVOCAR A MANO. Un clic en PINKY dispara uno al azar, y eso es
 * lo que la hace sentir viva de verdad: la diferencia entre mirar algo que se
 * mueve y tocar algo que responde.
 * ============================================================================
 */

const MIN_GAP_MS = 8000;
const MAX_GAP_MS = 15000;

/** Cuanto dura el gesto mas largo, con margen. Ver los keyframes. */
const GESTURE_MS = 3200;

export interface UsePinkyGestures {
  /** El gesto que se esta reproduciendo, o `null`. */
  gesture: PinkyGesture | null;
  /** Dispara uno al azar ahora mismo. Es lo que llama el clic. */
  poke: () => void;
}

export function usePinkyGestures(state: PinkyState, reducedMotion: boolean): UsePinkyGestures {
  const [gesture, setGesture] = useState<PinkyGesture | null>(null);

  const lastRef = useRef<PinkyGesture | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Uno al azar que no sea el anterior. Regla 2. */
  const pick = useCallback((): PinkyGesture => {
    const options = PINKY_GESTURES.filter((candidate) => candidate !== lastRef.current);
    const choice = options[Math.floor(Math.random() * options.length)]!;
    lastRef.current = choice;
    return choice;
  }, []);

  /**
   * Lanza un gesto y programa su retirada.
   *
   * SIN `requestAnimationFrame`, y no por gusto: rAF se para en seco cuando la
   * pestana deja de pintarse, asi que un `play` envuelto en rAF no llega a
   * ejecutarse nunca con la ventana detras. Es el mismo fallo que tenia el
   * cronometro del grabador de voz, y aqui ademas el rodeo sobraba.
   *
   * Sobraba porque el valor SIEMPRE cambia: `pick` nunca devuelve el gesto
   * anterior, y entre gesto y gesto el atributo pasa por `null`. Una animacion
   * CSS solo necesita reiniciarse cuando el valor se repite, y aqui no se
   * repite. El laboratorio es otra cosa -sus botones si repiten- y por eso
   * alli si hay un paso intermedio.
   */
  const play = useCallback((next: PinkyGesture) => {
    if (clearRef.current) clearTimeout(clearRef.current);

    setGesture(next);
    clearRef.current = setTimeout(() => setGesture(null), GESTURE_MS);
  }, []);

  const poke = useCallback(() => {
    if (reducedMotion) return;
    play(pick());
  }, [play, pick, reducedMotion]);

  /* ------------------------------------------------------- el temporizador */

  useEffect(() => {
    // Reglas 1 y 5: fuera del reposo, y con movimiento reducido, ni se
    // programa. Y lo que hubiera en marcha se corta -regla 4-, porque este
    // efecto se re-ejecuta justo cuando el estado cambia por una interaccion.
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

  // Al desmontar, ningun temporizador sobrevive.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (clearRef.current) clearTimeout(clearRef.current);
    },
    [],
  );

  return { gesture, poke };
}
