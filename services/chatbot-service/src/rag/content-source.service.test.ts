import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentSourceService } from './content-source.service';
import { split } from './indexer.service';

/**
 * ============================================================================
 * LA REGLA CRITICA DE ESTA FASE
 * ============================================================================
 * Lo que no publica el sitio no entra al indice. Un bot que cita datos sin
 * contrastar tira por tierra todo el trabajo de verificacion de las fases
 * anteriores, y encima lo hace con voz de fuente.
 *
 * La defensa es estructural, no un filtro nuestro: se lee por la API PUBLICA,
 * que ya excluye `verified: false`. Estos tests fijan esa estructura para que
 * nadie la cambie sin darse cuenta.
 * ============================================================================
 */

function configWith(values: Record<string, string>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('ContentSourceService', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function respondWith(payload: unknown) {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: payload }),
    } as unknown as Response);
  }

  /**
   * Responde a cada ruta con lo suyo. Con `respondWith` todas las llamadas
   * devuelven lo mismo, y aqui hace falta que la LISTA de integrantes y la
   * FICHA de una sean cosas distintas.
   */
  function routeTo(routes: Record<string, unknown>) {
    fetchMock.mockImplementation((input: URL | string) => {
      const path = new URL(String(input)).pathname;
      const payload = routes[path] ?? [];
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: payload }),
      } as unknown as Response);
    });
  }

  it('indexa cada obra en solitario con TODAS sus canciones y sus invitadas', async () => {
    // Antes era una linea por integrante con titulos y años: PINKY sabia que
    // existia «Ruby» pero no que canciones trae ni con quien canta Handlebars.
    routeTo({
      '/api/v1/members': [{ slug: 'jennie' }],
      '/api/v1/members/jennie': {
        slug: 'jennie',
        stageName: 'JENNIE',
        fullName: 'Kim Jennie',
        position: 'Rapera y vocalista',
        nationality: 'Corea del Sur',
        birthDate: '1996-01-16',
        bio: null,
        trivia: [],
        soloWorks: [
          {
            slug: 'jennie-ruby',
            title: 'Ruby',
            releaseDate: '2025-03-07',
            formatLabel: 'Álbum de estudio',
            description: null,
            tracks: [
              { title: 'Mantra', trackNumber: 7, isTitleTrack: true, featuring: null },
              { title: 'Handlebars', trackNumber: 4, isTitleTrack: false, featuring: 'Dua Lipa' },
            ],
          },
        ],
      },
    });

    const service = new ContentSourceService(
      configWith({ CONTENT_SERVICE_URL: 'http://content.test' }),
    );
    const items = await service.collect('es');

    const ruby = items.find((item) => item.key === 'solo:jennie-ruby');
    expect(ruby?.text).toContain('Ruby, Álbum de estudio de JENNIE, publicado el 2025-03-07.');
    expect(ruby?.text).toContain('7. Mantra (cancion principal)');
    expect(ruby?.text).toContain('4. Handlebars (con Dua Lipa)');
    expect(ruby?.sourcePath).toBe('/integrantes/jennie');
  });

  it('la ficha lleva la posicion y la nacionalidad, que son los campos del contrato', async () => {
    // Se leian `role` y `birthPlace`, que la API no devuelve: las dos lineas
    // salian siempre vacias y nada avisaba.
    routeTo({
      '/api/v1/members': [{ slug: 'rose' }],
      '/api/v1/members/rose': {
        slug: 'rose',
        stageName: 'ROSÉ',
        fullName: 'Roseanne Park',
        position: 'Vocalista principal',
        nationality: 'Nueva Zelanda',
        birthDate: '1997-02-11',
        bio: null,
        trivia: [],
        soloWorks: [],
      },
    });

    const service = new ContentSourceService(
      configWith({ CONTENT_SERVICE_URL: 'http://content.test' }),
    );
    const items = await service.collect('es');
    const ficha = items.find((item) => item.key === 'member:rose');

    expect(ficha?.text).toContain('Posicion en el grupo: Vocalista principal.');
    expect(ficha?.text).toContain('Nacionalidad: Nueva Zelanda.');
  });

  it('NUNCA pide contenido sin contrastar', async () => {
    respondWith([]);

    const service = new ContentSourceService(
      configWith({ CONTENT_SERVICE_URL: 'http://content.test' }),
    );
    await service.collect('es');

    expect(fetchMock).toHaveBeenCalled();

    for (const call of fetchMock.mock.calls) {
      const url = String((call[0] as URL).toString());
      expect(url).not.toContain('includeUnverified');
    }
  });

  it('pide el idioma en cada llamada: un indice mezclado responde en el idioma equivocado', async () => {
    respondWith([]);

    const service = new ContentSourceService(
      configWith({ CONTENT_SERVICE_URL: 'http://content.test' }),
    );
    await service.collect('ko');

    for (const call of fetchMock.mock.calls) {
      expect(String((call[0] as URL).toString())).toContain('locale=ko');
    }
  });

  it('usa la clave interna para no chocar con el limite por IP', async () => {
    respondWith([]);

    const service = new ContentSourceService(
      configWith({ CONTENT_SERVICE_URL: 'http://content.test', INTERNAL_API_KEY: 'secreto' }),
    );
    await service.collect('es');

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect((init.headers as Record<string, string>)['x-internal-key']).toBe('secreto');
  });

  it('sin clave interna no inventa la cabecera', async () => {
    respondWith([]);

    const service = new ContentSourceService(
      configWith({ CONTENT_SERVICE_URL: 'http://content.test' }),
    );
    await service.collect('es');

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect((init.headers as Record<string, string>)['x-internal-key']).toBeUndefined();
  });

  it('un fallo de una seccion no tumba el indexado entero', async () => {
    fetchMock.mockRejectedValue(new Error('sin red'));

    const service = new ContentSourceService(
      configWith({ CONTENT_SERVICE_URL: 'http://content.test' }),
    );

    await expect(service.collect('es')).resolves.toEqual([]);
  });

  it('un 500 puntual se reintenta y la seccion no se pierde', async () => {
    // Paso de verdad: un pool de Postgres saturado durante un segundo dejo a
    // PINKY en coreano sin un solo album hasta el siguiente reindexado.
    let albumsCalls = 0;
    fetchMock.mockImplementation((input: URL | string) => {
      const path = new URL(String(input)).pathname;
      if (path === '/api/v1/albums' && (albumsCalls += 1) === 1) {
        return Promise.resolve({ ok: false, status: 500 } as Response);
      }
      const payload =
        path === '/api/v1/albums'
          ? [{ slug: 'deadline' }]
          : path === '/api/v1/albums/deadline'
            ? {
                slug: 'deadline',
                title: 'DEADLINE',
                type: 'EP',
                releaseDate: '2026-02-27',
                formatLabel: 'EP',
                label: null,
                description: null,
                tracks: [],
              }
            : [];
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: payload }),
      } as unknown as Response);
    });

    const service = new ContentSourceService(
      configWith({ CONTENT_SERVICE_URL: 'http://content.test' }),
    );
    const { items, failed } = await service.collectWithReport('ko');

    expect(albumsCalls).toBe(2);
    expect(items.some((item) => item.key === 'album:deadline')).toBe(true);
    expect(failed).toEqual([]);
  });

  it('dice que secciones no llegaron, y un 404 no cuenta como fallo', async () => {
    fetchMock.mockImplementation((input: URL | string) => {
      const path = new URL(String(input)).pathname;
      if (path === '/api/v1/timeline') return Promise.reject(new Error('sin red'));
      // Un 404 describe la peticion: repetirla da lo mismo y no falta nada.
      if (path === '/api/v1/awards') return Promise.resolve({ ok: false, status: 404 } as Response);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      } as unknown as Response);
    });

    const service = new ContentSourceService(
      configWith({ CONTENT_SERVICE_URL: 'http://content.test' }),
    );
    const { failed } = await service.collectWithReport('es');

    expect(failed).toEqual(['/api/v1/timeline']);
    // Uno y su reintento; el 404, una sola vez.
    const calls = (p: string) =>
      fetchMock.mock.calls.filter((c) => new URL(String(c[0])).pathname === p).length;
    expect(calls('/api/v1/timeline')).toBe(2);
    expect(calls('/api/v1/awards')).toBe(1);
  });
});

describe('troceado', () => {
  const base = {
    key: 'album:born-pink',
    sourceLabel: 'Ficha de BORN PINK',
    sourcePath: '/discografia/born-pink',
  };

  it('deja intacto lo que ya cabe', () => {
    const pieces = split({ ...base, text: 'Un texto corto.' });
    expect(pieces).toHaveLength(1);
    expect(pieces[0]!.text).toBe('Un texto corto.');
  });

  it('parte por frase, no por caracter: una fecha cortada por la mitad se acaba citando', () => {
    const frase = 'BORN PINK se publico el 16 de septiembre de 2022. ';
    const pieces = split({ ...base, text: frase.repeat(40) });

    expect(pieces.length).toBeGreaterThan(1);
    for (const piece of pieces) {
      expect(piece.text.endsWith('.')).toBe(true);
      expect(piece.text).not.toMatch(/\d$/);
    }
  });

  it('cada trozo conserva su seccion para poder citarla', () => {
    const pieces = split({ ...base, text: 'Frase. '.repeat(300) });
    for (const piece of pieces) {
      expect(piece.sourcePath).toBe('/discografia/born-pink');
      expect(piece.sourceLabel).toBe('Ficha de BORN PINK');
    }
  });
});
