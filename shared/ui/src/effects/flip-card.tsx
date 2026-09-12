// Tarjeta que se gira para mostrar su reverso.
'use client';

import { useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '../cn';

export interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  label: string;
  className?: string;
}

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
