// Tarjeta con inclinación 3D al pasar el ratón.
'use client';

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import type { PointerEvent, ReactNode } from 'react';
import { cn } from '../cn';

export interface TiltCardProps {
  children: ReactNode;
  accent?: string | null;
  className?: string;
  maxTilt?: number;
}

export function TiltCard({ children, accent, className, maxTilt = 7 }: TiltCardProps) {
  const reduceMotion = useReducedMotion();

  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const spring = { stiffness: 150, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useMotionValue(0), spring);
  const rotateY = useSpring(useMotionValue(0), spring);

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
