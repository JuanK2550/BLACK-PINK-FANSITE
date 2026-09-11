'use client';

import { useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from './cn';

export interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  /** Etiqueta accesible del botón: describe qué se revela. */
  label: string;
  className?: string;
}

/**
 * ============================================================================
 * TARJETA VOLTEABLE
 * ============================================================================
 * Es un BOTÓN, no un div con onClick. Eso le da foco de teclado, activación
 * con Enter y Espacio, y `aria-pressed` para que un lector de pantalla anuncie
 * si está volteada. Una tarjeta que solo responde al ratón deja fuera a quien
 * navega con teclado, y aquí el reverso es contenido, no decoración.
 *
 * Las DOS caras están siempre en el DOM: el lector de pantalla las lee las
 * dos, así que el dato del reverso nunca queda inaccesible. Lo que las oculta
 * visualmente es `backface-visibility`, no `display`.
 *
 * Con movimiento reducido no gira: cambia de cara sin más. El giro 3D es de
 * los efectos que peor sientan a quien sufre mareo por movimiento.
 * ============================================================================
 */
export function FlipCard({ front, back, label, className }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      aria-pressed={flipped}
      aria-label={label}
      onClick={() => setFlipped((value) => !value)}
      className={cn(
        'bp-flip focus-visible:outline-focus group/flip relative block w-full text-left',
        'focus-visible:outline-2 focus-visible:outline-offset-4',
        className,
      )}
      data-flipped={flipped}
      data-static={reduceMotion ? 'true' : undefined}
    >
      <span className="bp-flip-inner block">
        <span className="bp-flip-face bp-flip-front">{front}</span>
        <span className="bp-flip-face bp-flip-back">{back}</span>
      </span>
    </button>
  );
}
