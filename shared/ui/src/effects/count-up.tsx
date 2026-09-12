// Número que cuenta hacia arriba al aparecer.
'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { VisuallyHidden } from '../a11y';

export interface CountUpProps {
  value: number;
  format: (value: number) => string;
  duration?: number;
  className?: string;
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function easeOut(progress: number): number {
  return 1 - Math.pow(1 - progress, 4);
}

export function CountUp({ value, format, duration = 1200, className }: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const counted = useRef(false);

  useIsoLayoutEffect(() => {
    if (counted.current) {
      setDisplay(value);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') return;

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
      <span aria-hidden="true" data-numeric>
        {format(display)}
      </span>
      <VisuallyHidden>{format(value)}</VisuallyHidden>
    </span>
  );
}
