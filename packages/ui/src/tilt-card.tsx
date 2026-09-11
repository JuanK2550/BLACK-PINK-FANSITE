'use client';

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import type { PointerEvent, ReactNode } from 'react';
import { cn } from './cn';

export interface TiltCardProps {
  children: ReactNode;
  /** Color de acento propio. Tiñe el halo que sigue al puntero. */
  accent?: string | null;
  className?: string;
  /** Grados máximos de inclinación. Más de 8 y deja de leerse como una tarjeta. */
  maxTilt?: number;
}

/**
 * ============================================================================
 * TARJETA CON INCLINACIÓN 3D
 * ============================================================================
 * La inclinación pasa por un MUELLE, no por la posición del puntero directa.
 * Atada al puntero sin más, la tarjeta se pega al cursor y el efecto se siente
 * mecánico; con muelle tiene inercia y se lee como un objeto físico.
 *
 * Es decoración pura, así que:
 *
 *   - solo se activa con puntero fino (`@media (hover: hover) and
 *     (pointer: fine)`): en táctil el hover se queda pegado tras el toque;
 *   - se apaga entera con `prefers-reduced-motion`, que es justo el efecto
 *     que más marea;
 *   - no afecta al foco de teclado: quien navega con Tab ve la tarjeta quieta
 *     y perfectamente usable.
 * ============================================================================
 */
export function TiltCard({ children, accent, className, maxTilt = 7 }: TiltCardProps) {
  const reduceMotion = useReducedMotion();

  // Posición del puntero dentro de la tarjeta, de -0.5 a 0.5.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const spring = { stiffness: 150, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useMotionValue(0), spring);
  const rotateY = useSpring(useMotionValue(0), spring);

  // El halo sigue al puntero con el color de acento de la integrante.
  const glowX = useSpring(px, { stiffness: 120, damping: 20 });
  const glowY = useSpring(py, { stiffness: 120, damping: 20 });
  const glow = useMotionTemplate`radial-gradient(220px circle at calc(50% + ${glowX}px) calc(50% + ${glowY}px), ${accent ?? 'var(--color-accent)'}22, transparent 70%)`;

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== 'mouse') return;

    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;

    px.set(offsetX);
    py.set(offsetY);
    // El eje se invierte: mover el ratón a la derecha inclina la tarjeta
    // como si se empujara ese lado hacia dentro.
    rotateY.set((offsetX / (rect.width / 2)) * maxTilt);
    rotateX.set((-offsetY / (rect.height / 2)) * maxTilt);
  }

  function reset() {
    rotateX.set(0);
    rotateY.set(0);
    px.set(0);
    py.set(0);
  }

  return (
    <motion.div
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        transformStyle: 'preserve-3d',
      }}
      className={cn('group/tilt relative', className)}
    >
      {children}

      {/* El halo va encima pero no intercepta el puntero ni el foco. */}
      {!reduceMotion ? (
        <motion.span
          aria-hidden="true"
          style={{ background: glow }}
          className="ease-out-soft pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--dur-3)] group-hover/tilt:opacity-100"
        />
      ) : null}
    </motion.div>
  );
}
