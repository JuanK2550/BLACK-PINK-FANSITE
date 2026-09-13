// Pruebas de lo que la web envía a Sentry.

import { describe, expect, it } from 'vitest';
import { scrubBreadcrumb, scrubEvent, sentryOptions, stripQuery } from './sentry';

describe('stripQuery', () => {
  it('quita la consulta y el fragmento', () => {
    expect(stripQuery('https://api.example/api/v1/search?q=jennie#top')).toBe(
      'https://api.example/api/v1/search',
    );
    expect(stripQuery('/es/quiz')).toBe('/es/quiz');
  });
});

describe('scrubEvent', () => {
  it('solo deja la ruta y el navegador', () => {
    const event = scrubEvent({
      request: {
        url: 'https://sitio.example/es/quiz?score=9',
        data: { mensaje: 'hola' },
        cookies: { NEXT_LOCALE: 'es' },
        query_string: 'score=9',
        headers: { 'user-agent': 'Safari', referer: 'https://otra.example' },
      },
      user: { ip_address: '203.0.113.7' },
    });

    expect(event).toEqual({
      request: { url: 'https://sitio.example/es/quiz', headers: { 'user-agent': 'Safari' } },
    });
  });

  it('sin user-agent no inventa cabeceras', () => {
    expect(scrubEvent({ request: { headers: { cookie: 'a=b' } } })).toEqual({
      request: { headers: {} },
    });
  });
});

describe('scrubBreadcrumb', () => {
  it('las peticiones del navegador pierden la consulta', () => {
    expect(scrubBreadcrumb({ data: { url: '/api/v1/search?q=rose', method: 'GET' } })).toEqual({
      data: { url: '/api/v1/search', method: 'GET' },
    });
    const click = { category: 'ui.click' };
    expect(scrubBreadcrumb(click)).toEqual({ category: 'ui.click' });
  });
});

describe('sentryOptions', () => {
  it('nunca envía datos personales por defecto', () => {
    expect(sentryOptions().sendDefaultPii).toBe(false);
  });
});
