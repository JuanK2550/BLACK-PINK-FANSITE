// Portada con efecto parallax en la ficha de disco.
'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

export interface ParallaxCoverProps {
  children: ReactNode;
  className?: string;
}

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
