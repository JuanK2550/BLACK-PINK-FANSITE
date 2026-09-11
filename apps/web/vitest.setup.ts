import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/**
 * ============================================================================
 * PREPARACIÓN DE LOS TESTS DEL FRONTEND
 * ============================================================================
 * Se desmonta después de CADA test. Sin esto, dos tests que rendericen el
 * mismo componente encuentran dos copias en el documento y `getByRole` falla
 * con «found multiple elements», que es un fallo confuso porque no tiene nada
 * que ver con lo que se estaba probando.
 *
 * `matchMedia` NO EXISTE EN jsdom, y este sitio lo consulta en todas partes:
 * el conteo ascendente, el imán, los gestos de PINKY y `Reveal` preguntan por
 * `prefers-reduced-motion` antes de moverse. Sin este doble, cualquier
 * componente con movimiento revienta al montar. Por defecto responde que NO
 * hay preferencia de movimiento reducido: es el caso normal, y el contrario se
 * fuerza en el test que lo necesita.
 *
 * `IntersectionObserver` tampoco existe. Aquí lo usan `Reveal` y `CountUp`
 * para saber si algo ha entrado en pantalla. El doble guarda el elemento
 * observado y expone un disparador, para que un test pueda decir «ahora entra
 * en pantalla» sin depender de un desplazamiento que en jsdom no ocurre.
 * ============================================================================
 */

afterEach(() => {
  cleanup();
});

if (typeof window !== 'undefined') {
  /*
   * `scrollIntoView` NO EXISTE EN jsdom, y aquí lo usa el encuadre del quiz al
   * empezar la partida. Sin el doble, todo test que pulse «Empezar» revienta
   * con «is not a function», que despista: el fallo no está en el quiz.
   */
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

    /** Todas las instancias vivas, para que un test pueda dispararlas. */
    static instancias: ObservadorFalso[] = [];

    /** «Ahora esto está en pantalla». Lo llama el test, no el navegador. */
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
