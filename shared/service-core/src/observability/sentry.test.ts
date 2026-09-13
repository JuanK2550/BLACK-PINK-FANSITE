// Pruebas de lo que llega a Sentry desde los servicios.

import { describe, expect, it } from 'vitest';
import { captureServerError, initSentry, scrubEvent } from './sentry';

describe('scrubEvent', () => {
  it('quita cuerpo, cookies, consulta, cabeceras y usuario', () => {
    const event = scrubEvent({
      request: {
        url: 'https://api.example/api/v1/search?q=nombre&locale=es',
        data: 'audio o mensaje',
        cookies: { sesion: 'x' },
        query_string: 'q=nombre',
        headers: { 'user-agent': 'Firefox', 'x-internal-key': 'secreto', cookie: 'a=b' },
      },
      user: { ip_address: '203.0.113.7' },
    });

    expect(event).toEqual({
      request: { url: 'https://api.example/api/v1/search', headers: { 'user-agent': 'Firefox' } },
    });
  });

  it('un evento sin petición sale igual', () => {
    expect(scrubEvent({})).toEqual({});
  });
});

describe('sin SENTRY_DSN', () => {
  it('no se activa', () => {
    expect(initSentry('content-service', { SENTRY_DSN: '  ' })).toBe(false);
  });

  it('capturar un error no hace nada', () => {
    expect(() => captureServerError(new Error('fallo'), 500)).not.toThrow();
  });
});
