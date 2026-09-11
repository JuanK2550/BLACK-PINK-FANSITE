'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

export interface ParallaxCoverProps {
  children: ReactNode;
  className?: string;
}

/**
 * ============================================================================
 * PORTADA CON PARALLAX
 * ============================================================================
 * La portada sube más despacio que el resto de la página al hacer scroll. Es
 * el único efecto ligado al desplazamiento de todo el sitio, y está aquí
 * porque una portada de disco es el objeto físico de esta página: darle
 * profundidad tiene sentido en la ficha de un álbum y no lo tendría en un
 * listado.
 *
 * DETALLES QUE LO HACEN VIABLE:
 *
 *   - Solo `transform`, que se compone en GPU. Mover `top` en cada fotograma
 *     dispararía layout y pintado con el scroll, que es como se consigue que
 *     una página vaya a tirones.
 *   - `offset` acotado al recorrido del elemento: el efecto solo trabaja
 *     mientras la portada está en pantalla.
 *   - Recorrido corto (48px). El parallax exagerado desalinea la portada de
 *     su propio pie y se lee como un error de maquetación, no como profundidad.
 *   - Con `prefers-reduced-motion` desaparece por completo: un elemento que se
 *     mueve a distinta velocidad que la página es de lo peor para el mareo.
 * ============================================================================
 */
export function ParallaxCover({ children, className }: ParallaxCoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [24, -24]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduceMotion ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}
