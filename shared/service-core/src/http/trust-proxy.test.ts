// Pruebas de la lectura de TRUST_PROXY.

import type { INestApplication } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { applyTrustProxy, parseTrustProxy } from './trust-proxy';

function fakeApp() {
  const set = vi.fn();
  const app = {
    getHttpAdapter: () => ({ getInstance: () => ({ set }) }),
  } as unknown as INestApplication;
  return { app, set };
}

describe('parseTrustProxy', () => {
  it('sin valor no hay ajuste', () => {
    expect(parseTrustProxy(undefined)).toBeUndefined();
    expect(parseTrustProxy('   ')).toBeUndefined();
  });

  it('un número es la cantidad de proxies delante', () => {
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy(' 2 ')).toBe(2);
  });

  it('entiende true y false', () => {
    expect(parseTrustProxy('true')).toBe(true);
    expect(parseTrustProxy('false')).toBe(false);
  });

  it('una lista de subredes pasa tal cual', () => {
    expect(parseTrustProxy('loopback, 10.0.0.0/8')).toBe('loopback, 10.0.0.0/8');
  });
});

describe('applyTrustProxy', () => {
  it('configura express con el valor leído', () => {
    const { app, set } = fakeApp();
    applyTrustProxy(app, '1');
    expect(set).toHaveBeenCalledWith('trust proxy', 1);
  });

  it('sin variable deja express como está', () => {
    const { app, set } = fakeApp();
    applyTrustProxy(app, '');
    expect(set).not.toHaveBeenCalled();
  });
});
