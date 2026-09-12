// Pruebas del contador del debut.

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DebutCounter } from './debut-counter';

const LABELS = { days: 'Días desde el debut', years: 'Años', since: 'Desde el' };

const DEBUT = '2016-08-08';
const DIAS = 3681;

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
    const { container } = pintar();
    const ocultas = [...container.querySelectorAll('.sr-only')].map((n) => n.textContent);
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
