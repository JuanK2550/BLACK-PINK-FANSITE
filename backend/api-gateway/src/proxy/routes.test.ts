// Pruebas de la lista blanca de rutas.

import { describe, expect, it } from 'vitest';
import { ROUTES, resolveRoute } from './routes';

describe('tabla de enrutado', () => {
  it('reescribe el prefijo publico al del servicio', () => {
    expect(resolveRoute('/content/members')).toMatchObject({
      upstreamPath: '/api/v1/members',
      rule: { upstream: 'content' },
    });
  });

  it('conserva los segmentos siguientes', () => {
    expect(resolveRoute('/content/albums/born-pink')?.upstreamPath).toBe(
      '/api/v1/albums/born-pink',
    );
    expect(resolveRoute('/media/tracks/abc/embed')?.upstreamPath).toBe('/api/v1/tracks/abc/embed');
  });

  it('gana el prefijo mas largo', () => {
    expect(resolveRoute('/content/search')?.rule.expensive).toBe(true);
  });

  it('es una lista blanca: lo que no esta declarado NO se reenvia', () => {
    expect(resolveRoute('/content/admin')).toBeNull();
    expect(resolveRoute('/content')).toBeNull();
    expect(resolveRoute('/otra-cosa')).toBeNull();
    expect(resolveRoute('/media/../content/admin')).toBeNull();
  });

  it('no confunde un prefijo con el comienzo de otra palabra', () => {
    expect(resolveRoute('/content/membersecretos')).toBeNull();
  });

  it('los endpoints costosos estan marcados y el resto no', () => {
    const expensive = ROUTES.filter((route) => route.expensive).map((route) => route.prefix);
    expect(expensive).toEqual(['/content/search', '/content/quiz']);
  });

  it('toda ruta declara un TTL positivo', () => {
    for (const route of ROUTES) {
      expect(route.ttl).toBeGreaterThan(0);
    }
  });

  it('la busqueda se cachea menos que la discografia', () => {
    const search = ROUTES.find((route) => route.prefix === '/content/search')!;
    const albums = ROUTES.find((route) => route.prefix === '/content/albums')!;
    expect(search.ttl).toBeLessThan(albums.ttl);
  });
});
