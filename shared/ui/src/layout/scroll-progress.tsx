// Barra de progreso de lectura.
'use client';

import { motion, useScroll } from 'framer-motion';
import { cn } from '../cn';

export interface ScrollProgressProps {
  className?: string;
  label: string;
}

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
