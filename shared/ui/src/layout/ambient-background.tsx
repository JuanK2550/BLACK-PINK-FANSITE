// Fondo decorativo del sitio.
'use client';

import { useEffect, useState } from 'react';

export function AmbientBackground() {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    function onVisibilityChange() {
      setPaused(document.hidden);
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="animate-bp-drift absolute left-[-10%] top-[-20%] h-[70vmax] w-[70vmax] rounded-full opacity-70 will-change-transform"
        style={{
          animationPlayState: paused ? 'paused' : 'running',
          background:
            'radial-gradient(circle at center, rgb(255 46 136 / 0.16) 0%, rgb(255 46 136 / 0.05) 42%, transparent 68%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
