// Aparición suave al entrar en pantalla.
'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article';
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Reveal({ children, delay = 0, className, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<null | 'hidden' | 'shown'>(null);

  useIsoLayoutEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    if (node.getBoundingClientRect().top < window.innerHeight) return;

    setState('hidden');
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (state !== 'hidden' || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setState('shown');
      },
      { rootMargin: '-60px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [state]);

  const Component = as;

  return (
    <Component
      // @ts-expect-error -- el ref es de HTMLElement y la etiqueta es dinámica.
      ref={ref}
      data-reveal={state ?? undefined}
      style={state === 'shown' && delay ? { animationDelay: `${delay}s` } : undefined}
      className={className}
    >
      {children}
    </Component>
  );
}
