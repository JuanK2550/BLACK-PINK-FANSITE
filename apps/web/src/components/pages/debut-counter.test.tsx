// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DebutCounter } from './debut-counter';

/**
 * ============================================================================
 * EL CONTADOR DE `/grupo`
 * ============================================================================
 * Lo que se prueba no es que sepa sumar —eso ya lo cubre `debut.test.ts`— sino
 * las tres decisiones que sostienen el componente:
 *
 * 1. Que el SERVIDOR pinta la cifra de verdad, no un cero. Es lo que hace que
 *    el número esté en el HTML sin JavaScript y que no haya desajuste de
 *    hidratación.
 * 2. Que la cifra verdadera llega al lector de pantalla aunque la visible esté
 *    a mitad del conteo.
 * 3. Que con `prefers-reduced-motion` no hay conteo: aquí reducir SÍ es apagar,
 *    porque el movimiento ES el número cambiando.
 * ============================================================================
 */

const LABELS = { days: 'Días desde el debut', years: 'Años', since: 'Desde el' };

const DEBUT = '2016-08-08';
const DIAS = 3681;

/*
 * EL RELOJ SE CONGELA, y no es un adorno del test.
 *
 * El componente recalcula las cifras al montar, contra `Date.now()`. Sin
 * congelar, el valor esperado cambia cada medianoche UTC: el test pasaba hoy
 * -3.681- y fallaba mañana con 3.682. Se fija el instante en el que se
 * cumplen exactamente los días que llegan como prop, así que lo que se
 * comprueba es el CABLEADO -que el servidor manda y el cliente confirma- y no
 * la aritmética, que ya tiene sus propios tests en `debut.test.ts`.
 */
const INSTANTE = Date.parse(`${DEBUT}T00:00:00Z`) + DIAS * 86_400_000 + 3_600_000;

beforeAll(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(INSTANTE);
});

afterAll(() => {
  vi.useRealTimers();
});

function pintar(extra: Partial<Parameters<typeof DebutCounter>[0]> = {}) {
  return render(
    <DebutCounter
      debutDate={DEBUT}
      initialDays={DIAS}
      initialYears={10}
      locale="es"
      labels={LABELS}
      {...extra}
    />,
  );
}

describe('DebutCounter', () => {
  it('pinta la fecha del debut con su elemento <time>', () => {
    const { container } = pintar();
    const time = container.querySelector('time');
    expect(time).toHaveAttribute('dateTime', DEBUT);
  });

  it('las dos etiquetas describen sus cifras', () => {
    pintar();
    expect(screen.getByText('Días desde el debut')).toBeInTheDocument();
    expect(screen.getByText('Años')).toBeInTheDocument();
  });

  it('la cifra verdadera está disponible para un lector de pantalla', () => {
    // Aunque la visible esté a medio contar, la accesible es la definitiva:
    // oír «3.386» como si fuera el dato sería peor que no oír nada.
    const { container } = pintar();
    const ocultas = [...container.querySelectorAll('.sr-only')].map((n) => n.textContent);
    // Sin separador de millares: `Intl` en español NO agrupa cuatro cifras, y
    // escribir «3.681» aquí sería exigirle al código algo que el idioma no
    // pide. Comprobado contra `Intl.NumberFormat('es-ES')`.
    expect(ocultas).toContain(String(DIAS));
    expect(ocultas).toContain('10');
  });

  it('la cifra que se mueve está oculta al lector de pantalla', () => {
    const { container } = pintar();
    const animada = container.querySelector('[aria-hidden="true"][data-numeric]');
    expect(animada).not.toBeNull();
  });

  it('con movimiento reducido no hay conteo: la cifra sale puesta', () => {
    vi.mocked(window.matchMedia).mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    const { container } = pintar();
    const animada = container.querySelector('[aria-hidden="true"][data-numeric]');
    expect(animada?.textContent).toBe(String(DIAS));
  });
});
