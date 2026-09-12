// Código Konami que activa el modo BLINK.
'use client';

import { useEffect, useRef, useState } from 'react';
import { THEME_STORAGE_KEY, type Theme } from '../controls/controls';

const SEQUENCE = [
  'arrowup',
  'arrowup',
  'arrowdown',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'arrowleft',
  'arrowright',
  'b',
  'a',
] as const;

const NOTICE_MS = 3200;

export interface KonamiEasterEggProps {
  labels: {
    title: string;
    hint: string;
  };
}

function esCampoDeTexto(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function KonamiEasterEgg({ labels }: KonamiEasterEggProps) {
  const [notice, setNotice] = useState(false);
  const progress = useRef(0);
  const previous = useRef<Theme>('dark');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function apply(theme: string) {
      document.documentElement.dataset.theme = theme;
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        /* Modo privado */
      }
    }

    function unlock() {
      const actual = document.documentElement.dataset.theme;

      if (actual === 'blink') {
        apply(previous.current);
        setNotice(false);
        return;
      }

      previous.current = actual === 'light' ? 'light' : 'dark';
      apply('blink');
      setNotice(true);
      clearTimeout(timer);
      timer = setTimeout(() => setNotice(false), NOTICE_MS);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (esCampoDeTexto(event.target)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();

      if (key === SEQUENCE[progress.current]) {
        progress.current += 1;
        if (progress.current === SEQUENCE.length) {
          progress.current = 0;
          unlock();
        }
        return;
      }

      progress.current = key === SEQUENCE[0] ? 1 : 0;
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="px-gutter pointer-events-none fixed inset-x-0 bottom-6 z-[95] flex justify-center"
    >
      {notice ? (
        <p className="border-line-strong bg-overlay text-fg shadow-lift-2 bp-blink-notice border px-5 py-3 text-sm">
          <span className="text-2xs text-accent-text block font-medium" data-uppercase>
            {labels.title}
          </span>
          <span className="text-fg-muted mt-1 block">{labels.hint}</span>
        </p>
      ) : null}
    </div>
  );
}
