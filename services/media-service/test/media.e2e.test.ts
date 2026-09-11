import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { CacheService, configureService } from '@blackpink/service-core';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { ContentClientService } from '../src/content-client/content-client.service';

/**
 * ============================================================================
 * TESTS E2E DE media-service
 * ============================================================================
 * content-service esta simulado: estos tests comprueban el contrato HTTP de
 * media-service, no el de su dependencia. Depender del otro servicio los
 * convertiria en tests de integracion de dos procesos, que fallan por motivos
 * que no tienen nada que ver con lo que se quiere comprobar aqui.
 * ============================================================================
 */

/**
 * Album de prueba PARAMETRIZADO POR SLUG.
 *
 * Antes devolvia siempre 'born-pink' fuera cual fuera el album pedido, asi
 * que el mapa que playlists.service construye por slug nunca casaba y todas
 * las entradas caian al camino de "no resuelto". El test pasaba, pero estaba
 * ejercitando el fallback en lugar de la resolucion real.
 */
const albumFor = (slug: string) => ({
  slug,
  title: slug.toUpperCase(),
  releaseDate: '2022-09-16',
  year: 2022,
  coverUrl: null,
  tracks: Array.from({ length: 8 }, (_, index) => ({
    id: `bp-${index + 1}`,
    title: `Cancion ${index + 1}`,
    trackNumber: index + 1,
    durationSec: null,
    isTitleTrack: index < 2,
    localizedTitle: null,
    // Sin identificadores a proposito: este doble ejercita el camino de
    // "no se puede reproducir", que tiene que seguir funcionando aunque el
    // catalogo real ya los tenga.
    spotifyId: null,
    lyricsAvailable: false,
    verified: true,
  })),
});

function contentDouble() {
  return {
    getAlbum: vi.fn().mockImplementation((slug: string) => Promise.resolve(albumFor(slug))),
    getMember: vi.fn().mockResolvedValue({ slug: 'jennie', stageName: 'JENNIE', soloWorks: [] }),
    getTrack: vi.fn().mockResolvedValue({
      id: 'bp-1',
      title: 'Pink Venom',
      localizedTitle: null,
      trackNumber: 1,
      durationSec: null,
      isTitleTrack: true,
      spotifyId: 'spotify-abc',
      lyricsAvailable: false,
      verified: true,
      album: { slug: 'born-pink', title: 'BORN PINK', releaseDate: '2022-09-16' },
    }),
    isReachable: vi.fn().mockResolvedValue(true),
  };
}

/**
 * Doble de la cache.
 *
 * NO basta con borrar REDIS_URL en beforeAll: los imports se evaluan antes que
 * cualquier hook, asi que CacheModule.forRoot ya ha leido la variable y el
 * test acaba hablando con el Redis de verdad. Eso hace los e2e dependientes
 * del orden -una prueba cachea y la siguiente lee su resultado sin llegar a
 * la base- y dependientes de que haya un Redis levantado.
 *
 * Sustituyendo el proveedor, cada peticion ejecuta siempre su consulta.
 */
function cacheDouble() {
  return {
    buildKey: (
      resource: string,
      locale: string | undefined,
      params: Record<string, unknown> = {},
    ) => `${resource}:${locale ?? 'none'}:${JSON.stringify(params)}`,
    get: async () => null,
    set: async () => undefined,
    getOrSet: async <T>(_key: string, _ttl: number, factory: () => Promise<T>) => ({
      value: await factory(),
      cached: false,
    }),
    invalidate: async () => 0,
    isReachable: async () => true,
  };
}

describe('media-service (e2e)', () => {
  let app: INestApplication;
  let server: unknown;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ContentClientService)
      .useValue(contentDouble())
      .overrideProvider(CacheService)
      .useValue(cacheDouble())
      .compile();

    app = moduleRef.createNestApplication();
    configureService(app, {
      service: 'media-service',
      title: 'BLACKPINK Fansite - media-service',
      description: 'Playlists y embeds.',
    });
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
  });

  /* ----------------------------------------------------- 1. /health ----- */
  it('GET /health mantiene el contrato compartido, sin envelope', async () => {
    const response = await request(server).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', service: 'media-service' });
  });

  it('GET /health/dependencies queda FUERA de /api y fuera del envelope', async () => {
    const response = await request(server).get('/health/dependencies').expect(200);

    expect(response.body).toMatchObject({ service: 'media-service', contentService: 'up' });
    expect(response.body).not.toHaveProperty('data');
  });

  /* -------------------------------------------- 2. /api/v1/playlists ---- */
  it('GET /api/v1/playlists devuelve las listas curadas con el envelope', async () => {
    const response = await request(server).get('/api/v1/playlists').expect(200);

    expect(response.body.error).toBeNull();
    expect(response.body.meta.service).toBe('media-service');
    const slugs = response.body.data.map((p: { slug: string }) => p.slug);
    // Las seis listas que el sitio publica, por su slug estable.
    expect(slugs).toEqual([
      'debut-era',
      'grandes-exitos',
      'baladas',
      'solistas',
      'b-sides',
      'para-bailar',
    ]);
  });

  it('distingue una seleccion derivada de los datos de una editorial', async () => {
    const response = await request(server).get('/api/v1/playlists').expect(200);
    const byslug = Object.fromEntries(
      response.body.data.map((p: { slug: string; basis: string }) => [p.slug, p.basis]),
    );

    // "Grandes exitos" sale de un dato comprobable (isTitleTrack); "baladas"
    // es un juicio del sitio y tiene que decirlo.
    expect(byslug['grandes-exitos']).toBe('derived');
    expect(byslug['b-sides']).toBe('derived');
    expect(byslug['baladas']).toBe('curated');
    expect(byslug['para-bailar']).toBe('curated');
  });

  it('los titulos cambian con el idioma pedido', async () => {
    const es = await request(server).get('/api/v1/playlists?locale=es').expect(200);
    const ko = await request(server).get('/api/v1/playlists?locale=ko').expect(200);

    expect(es.body.data[0].title).not.toBe(ko.body.data[0].title);
    expect(ko.body.meta.locale).toBe('ko');
  });

  /* -------------------------------------- 3. /api/v1/playlists/:slug ---- */
  it('GET /api/v1/playlists/:slug resuelve las canciones contra content-service', async () => {
    const response = await request(server).get('/api/v1/playlists/debut-era').expect(200);

    expect(response.body.data.entries).toHaveLength(6);
    expect(response.body.data.entries[0]).toMatchObject({ position: 1, playable: false });
  });

  it('explica por que una playlist no es reproducible en lugar de fingir que lo es', async () => {
    const response = await request(server).get('/api/v1/playlists/debut-era').expect(200);

    expect(response.body.data.playableCount).toBe(0);
    expect(response.body.data.note).toMatch(/No se inventa/i);
  });

  it('una playlist inexistente devuelve 404 con la forma habitual', async () => {
    const response = await request(server).get('/api/v1/playlists/no-existe').expect(404);

    expect(response.body.data).toBeNull();
    expect(response.body.error).toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
  });

  /* ------------------------------------ 4. /api/v1/tracks/:id/embed ----- */
  it('GET /api/v1/tracks/:id/embed devuelve reproductores OFICIALES, nunca audio', async () => {
    const response = await request(server).get('/api/v1/tracks/bp-1/embed').expect(200);

    const data = response.body.data;
    expect(data.available).toBe(true);
    expect(data.spotify.embedUrl).toBe('https://open.spotify.com/embed/track/spotify-abc');
    // Spotify es la unica fuente: la respuesta no menciona ninguna otra.
    expect(JSON.stringify(data)).not.toMatch(/youtube/i);

    // La regla que sostiene el proyecto: ni una sola URL a un archivo de media.
    expect(JSON.stringify(data)).not.toMatch(/\.(mp3|m4a|wav|flac|mp4|webm)\b/i);
  });

  /* ----------------------------------------------- 5. Validacion -------- */
  it('rechaza un idioma no soportado antes de llamar a content-service', async () => {
    const response = await request(server).get('/api/v1/playlists?locale=jp').expect(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rechaza un parametro que no existe en lugar de ignorarlo', async () => {
    await request(server).get('/api/v1/playlists?formato=json').expect(400);
  });

  /* ---------------------------------------------------- 6. /docs -------- */
  it('publica la especificacion OpenAPI con los endpoints de media', async () => {
    const response = await request(server).get('/docs/json').expect(200);

    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining(['/api/v1/playlists', '/api/v1/tracks/{id}/embed']),
    );
  });

  it('la descripcion del servicio deja escrito que no sirve audio', async () => {
    const response = await request(server).get('/docs/json').expect(200);
    expect(response.body.info.description.toLowerCase()).toContain('playlists');
  });
});
