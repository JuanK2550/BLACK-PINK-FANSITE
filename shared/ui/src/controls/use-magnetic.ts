// Efecto magnético al pasar el ratón.
'use client';

import { useEffect, useRef } from 'react';

export interface MagneticOptions {
  strength?: number;
  disabled?: boolean;
}

export function useMagnetic<T extends HTMLElement>({
  strength = 6,
  disabled = false,
}: MagneticOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || disabled) return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reduced.matches) return;

    function move(event: PointerEvent) {
      const el = ref.current;
      if (!el) return;

      const box = el.getBoundingClientRect();
      const dx = (event.clientX - (box.left + box.width / 2)) / box.width;
      const dy = (event.clientY - (box.top + box.height / 2)) / box.height;

      el.style.transform = `translate3d(${(dx * strength * 2).toFixed(2)}px, ${(
        dy *
        strength *
        2
      ).toFixed(2)}px, 0)`;
    }

    function reset() {
      const el = ref.current;
      if (el) el.style.transform = '';
    }

    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', reset);
    node.addEventListener('pointerdown', reset);

    return () => {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', reset);
      node.removeEventListener('pointerdown', reset);
      reset();
    };
  }, [strength, disabled]);

  return ref;
}
