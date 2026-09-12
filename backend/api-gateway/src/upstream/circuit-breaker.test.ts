// Pruebas del circuit breaker.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

const OPTIONS = { failureThreshold: 3, openMs: 1000, successThreshold: 2 };

const fail = () => Promise.reject(new Error('caido'));
const succeed = () => Promise.resolve('ok');

async function trip(breaker: CircuitBreaker, times = OPTIONS.failureThreshold) {
  for (let i = 0; i < times; i += 1) {
    await breaker.run(fail).catch(() => undefined);
  }
}

describe('CircuitBreaker', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('empieza cerrado y deja pasar todo', async () => {
    const breaker = new CircuitBreaker('test', OPTIONS);
    await expect(breaker.run(succeed)).resolves.toBe('ok');
    expect(breaker.currentState).toBe('closed');
  });

  it('se abre al alcanzar el umbral de fallos consecutivos', async () => {
    const breaker = new CircuitBreaker('test', OPTIONS);
    await trip(breaker);
    expect(breaker.currentState).toBe('open');
  });

  it('un exito reinicia la cuenta: los fallos deben ser CONSECUTIVOS', async () => {
    const breaker = new CircuitBreaker('test', OPTIONS);

    await trip(breaker, 2);
    await breaker.run(succeed);
    await trip(breaker, 2);

    expect(breaker.currentState).toBe('closed');
  });

  it('abierto falla al instante, sin llegar a llamar al servicio', async () => {
    const breaker = new CircuitBreaker('test', OPTIONS);
    await trip(breaker);

    const operation = vi.fn(succeed);
    await expect(breaker.run(operation)).rejects.toBeInstanceOf(CircuitOpenError);

    expect(operation).not.toHaveBeenCalled();
  });

  it('pasa a prueba cuando vence el tiempo de apertura', async () => {
    const breaker = new CircuitBreaker('test', OPTIONS);
    await trip(breaker);

    vi.advanceTimersByTime(OPTIONS.openMs);
    expect(breaker.currentState).toBe('half-open');
  });

  it('en prueba, un solo fallo vuelve a abrir', async () => {
    const breaker = new CircuitBreaker('test', OPTIONS);
    await trip(breaker);
    vi.advanceTimersByTime(OPTIONS.openMs);

    await breaker.run(fail).catch(() => undefined);
    expect(breaker.currentState).toBe('open');
  });

  it('en prueba, cierra tras los exitos exigidos', async () => {
    const breaker = new CircuitBreaker('test', OPTIONS);
    await trip(breaker);
    vi.advanceTimersByTime(OPTIONS.openMs);

    await breaker.run(succeed);
    expect(breaker.currentState).toBe('half-open');

    await breaker.run(succeed);
    expect(breaker.currentState).toBe('closed');
  });

  it('tras cerrar, la cuenta de fallos empieza de cero', async () => {
    const breaker = new CircuitBreaker('test', OPTIONS);
    await trip(breaker);
    vi.advanceTimersByTime(OPTIONS.openMs);
    await breaker.run(succeed);
    await breaker.run(succeed);

    await trip(breaker, 2);
    expect(breaker.currentState).toBe('closed');

    await trip(breaker, 1);
    expect(breaker.currentState).toBe('open');
  });

  it('propaga el error original, no uno propio', async () => {
    const breaker = new CircuitBreaker('test', OPTIONS);
    const original = new Error('ECONNREFUSED 127.0.0.1:4001');

    await expect(breaker.run(() => Promise.reject(original))).rejects.toBe(original);
  });
});
