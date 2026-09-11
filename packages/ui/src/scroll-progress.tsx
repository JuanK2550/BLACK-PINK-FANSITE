'use client';

import { motion, useScroll } from 'framer-motion';
import { cn } from './cn';

export interface ScrollProgressProps {
  className?: string;
  label: string;
}

/**
 * Barra de progreso de lectura, pegada al borde inferior del header.
 *
 * Va con scaleX y no con width: width provoca layout en cada fotograma,
 * scaleX se resuelve en la GPU. Y es lineal, no suavizada: representa una
 * posicion real, no un movimiento con intencion.
 */
export function ScrollProgress({ className, label }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      aria-hidden="true"
      title={label}
      style={{ scaleX: scrollYProgress }}
      className={cn('bg-accent h-0.5 w-full origin-left', className)}
    />
  );
}
