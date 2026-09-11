'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { VisuallyHidden } from './a11y';

/**
 * ============================================================================
 * CONTEO ASCENDENTE
 * ============================================================================
 * Una cifra que sube desde cero hasta su valor cuando entra en pantalla.
 *
 * EL SERVIDOR PINTA EL VALOR DE VERDAD, no un cero. Eso importa por tres
 * motivos y ninguno es estético: sin JavaScript la cifra sigue ahí, un
 * buscador lee el número y no un marcador de posición, y la primera pintura
 * del cliente coincide con el HTML del servidor, así que no hay desajuste de
 * hidratación. El cero se pone DESPUÉS de hidratar, en un efecto de
 * maquetado, que corre antes de pintar: no se llega a ver el valor final
 * parpadear.
 *
 * EL PROGRESO SE DERIVA DEL RELOJ, no de los fotogramas. Es la misma lección
 * que el cronómetro del grabador de voz y el reloj del quiz: un
 * `requestAnimationFrame` se detiene en seco cuando la pestaña deja de
 * pintarse. Contando fotogramas, volver a la pestaña dejaría la cifra
 * congelada a medias; midiendo el tiempo transcurrido, al volver ya ha pasado
 * la duración entera y la cifra salta directa a su valor. El fallo se cura
 * solo.
 *
 * SE CUENTA UNA VEZ Y NUNCA MÁS, y eso incluye los cambios de valor. El
 * contador de `/grupo` se actualiza al pasar la medianoche: sin el cerrojo,
 * ese cambio volvería a lanzar el conteo desde cero en una página que alguien
 * podría estar leyendo. Después de la primera vez, la cifra simplemente pasa
 * a ser la nueva. Es la misma decisión que toma `Reveal` con `once`.
 *
 * CON `prefers-reduced-motion` NO HAY CONTEO. Aquí reducir sí es apagar: el
 * movimiento ES el número cambiando, no hay una opacidad que conserve el
 * significado. La cifra aparece puesta, que es lo que se quería leer.
 * ============================================================================
 */

export interface CountUpProps {
  /** El valor real. Es lo que pinta el servidor y el destino del conteo. */
  value: number;
  /**
   * Cómo se escribe el número en este idioma. Lo decide quien lo usa: este
   * paquete no conoce el idioma ni debe importar el formateador de la app.
   */
  format: (value: number) => string;
  /**
   * Milisegundos. Por encima de los 300ms que rigen para la interfaz, a
   * propósito: esto se ve una vez por visita y su trabajo es que se note.
   */
  duration?: number;
  className?: string;
}

/**
 * `useLayoutEffect` avisa por consola si se ejecuta en el servidor. Aquí solo
 * hace falta en el cliente —es donde hay pintura a la que adelantarse—, así
 * que en el servidor se cae al efecto normal, que allí no llega a correr.
 */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * El gemelo en JavaScript de `--ease-out-bp` (`cubic-bezier(.23,1,.32,1)`):
 * arranca rápido y aterriza despacio. Resolver la bézier real costaría un
 * solucionador entero para una diferencia que nadie puede ver en una cifra.
 */
function easeOut(progress: number): number {
  return 1 - Math.pow(1 - progress, 4);
}

export function CountUp({ value, format, duration = 1200, className }: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  /** Se levanta cuando el conteo ARRANCA, no cuando se arma el observador. */
  const counted = useRef(false);

  useIsoLayoutEffect(() => {
    // Ya se contó una vez: a partir de aquí la cifra solo se pone al día.
    if (counted.current) {
      setDisplay(value);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') return;

    // Antes de pintar: la cifra se pone a cero para poder subir desde ahí.
    setDisplay(0);

    const run = () => {
      counted.current = true;
      const started = performance.now();

      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        setDisplay(Math.round(easeOut(progress) * value));
        if (progress < 1) frame.current = requestAnimationFrame(step);
      };

      frame.current = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        run();
      },
      // El mismo adelanto que usa `Reveal`: empieza justo antes de que la
      // cifra entre del todo, para terminar cuando el lector llega a ella.
      { rootMargin: '-60px' },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {/*
       * La cifra que se mueve se oculta al lector de pantalla y al lado va el
       * valor final. Sin esto, quien llegue con un lector durante el conteo
       * oiría un número a medio camino como si fuera el dato.
       */}
      <span aria-hidden="true" data-numeric>
        {format(display)}
      </span>
      <VisuallyHidden>{format(value)}</VisuallyHidden>
    </span>
  );
}
