'use client';

import { useEffect, useRef } from 'react';

/**
 * ============================================================================
 * HOVER MAGNETICO
 * ============================================================================
 * El elemento se desplaza unos pocos pixeles HACIA el puntero mientras este
 * lo sobrevuela, y vuelve a su sitio al salir.
 *
 * SIN `requestAnimationFrame` Y SIN MUELLE DE JAVASCRIPT. El desplazamiento se
 * escribe directamente en `style.transform` desde el propio `pointermove`, y
 * quien suaviza es una TRANSICION de CSS. Es la eleccion de Emil Kowalski para
 * cualquier cosa que se dispare muchas veces seguidas: una transicion se
 * reapunta sola a mitad de camino, mientras que unos keyframes -o un bucle de
 * animacion propio- reempiezan desde cero cada vez. Ademas corre fuera del
 * hilo principal y no cuesta ni un bucle abierto.
 *
 * SE ESCRIBE EN EL ELEMENTO, NO EN UNA VARIABLE CSS DEL PADRE. Cambiar una
 * custom property obliga a recalcular el estilo de todos sus descendientes;
 * escribir el `transform` del propio elemento no toca a nadie mas.
 *
 * SOLO CON RATON DE VERDAD (`hover: hover` y `pointer: fine`). En una pantalla
 * tactil el hover se dispara al tocar y el boton daria un salto justo cuando
 * ya lo has pulsado, que es el efecto contrario al que se busca.
 *
 * NADA CON `prefers-reduced-motion`. Aqui reducir SI es apagar: el efecto es
 * movimiento y solo movimiento, no hay una opacidad debajo que conserve
 * ninguna informacion. Ni siquiera se registran los escuchadores.
 *
 * EL RECORRIDO ES CORTO A PROPOSITO. Seis pixeles bastan para que la mano
 * note que el boton responde; con veinte, el boton se despega de su hueco y
 * el texto de al lado empieza a parecer mal alineado. Este sistema es
 * editorial: el guiño tiene que caber dentro de la retícula.
 * ============================================================================
 */

export interface MagneticOptions {
  /** Desplazamiento maximo en pixeles. */
  strength?: number;
  /** Desactiva el efecto sin cambiar la forma del componente. */
  disabled?: boolean;
}

export function useMagnetic<T extends HTMLElement>({
  strength = 6,
  disabled = false,
}: MagneticOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || disabled) return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reduced.matches) return;

    function move(event: PointerEvent) {
      const el = ref.current;
      if (!el) return;

      const box = el.getBoundingClientRect();
      // Posicion del puntero dentro del boton, de -0.5 a 0.5.
      const dx = (event.clientX - (box.left + box.width / 2)) / box.width;
      const dy = (event.clientY - (box.top + box.height / 2)) / box.height;

      el.style.transform = `translate3d(${(dx * strength * 2).toFixed(2)}px, ${(
        dy *
        strength *
        2
      ).toFixed(2)}px, 0)`;
    }

    function reset() {
      const el = ref.current;
      if (el) el.style.transform = '';
    }

    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', reset);
    // Al pulsar, el boton ya tiene su propio `active:scale`: el iman estorba.
    node.addEventListener('pointerdown', reset);

    return () => {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', reset);
      node.removeEventListener('pointerdown', reset);
      reset();
    };
  }, [strength, disabled]);

  return ref;
}
