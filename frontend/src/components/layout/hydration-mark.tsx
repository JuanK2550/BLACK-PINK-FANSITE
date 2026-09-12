// Marca la página como lista cuando React termina de cargar (lo usan los tests).
'use client';

import { useEffect } from 'react';

export function HydrationMark() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = '';
  }, []);
  return null;
}
