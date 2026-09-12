// Preparación común de los tests de la web.

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

if (typeof window !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  class ObservadorFalso implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    private readonly observados = new Set<Element>();

    constructor(private readonly callback: IntersectionObserverCallback) {
      ObservadorFalso.instancias.push(this);
    }

    static instancias: ObservadorFalso[] = [];

    entrar() {
      const entradas = [...this.observados].map(
        (target) => ({ target, isIntersecting: true }) as IntersectionObserverEntry,
      );
      this.callback(entradas, this);
    }

    observe(target: Element) {
      this.observados.add(target);
    }
    unobserve(target: Element) {
      this.observados.delete(target);
    }
    disconnect() {
      this.observados.clear();
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  window.IntersectionObserver = ObservadorFalso as unknown as typeof IntersectionObserver;
  (globalThis as { __observadores?: unknown }).__observadores = ObservadorFalso;
}
