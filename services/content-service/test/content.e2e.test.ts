import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { CacheService, configureService } from '@blackpink/service-core';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * ============================================================================
 * TESTS E2E DE content-service
 * ============================================================================
 * Levantan la aplicacion Nest COMPLETA y le hablan por HTTP con supertest, asi
 * que ejercitan de verdad el enrutado, el versionado, el ValidationPipe, el
 * interceptor del envelope y el filtro de excepciones.
 *
 * La capa de datos SI esta simulada, a proposito. Un e2e que necesita una base
 * de datos con contenido concreto deja de ser reproducible: falla en CI, falla
 * en una maquina nueva y falla cada vez que cambia el seed, y entonces la
 * gente lo desactiva. Lo que se comprueba aqui es el contrato HTTP; que las
 * consultas Prisma sean correctas se comprueba en los tests unitarios.
 * ============================================================================
 */

const memberRow = {
  slug: 'jisoo',
  stageName: 'JISOO',
  fullName: 'Kim Ji-soo',
  koreanName: '김지수',
  position: 'Vocalista',
  nationality: 'Corea del Sur',
  birthDate: new Date('1995-01-03T00:00:00.000Z'),
  colorAccent: '#c9a7ff',
  imageUrl: null,
  bio: 'Bio.',
  socials: null,
  verified: true,
  translations: [
    { locale: 'es', position: 'Vocalista', nickname: null, bio: null, description: null },
  ],
  soloWorks: [],
  trivia: [],
  timelineEvents: [],
};

const albumRow = {
  slug: 'born-pink',
  title: 'BORN PINK',
  type: 'ALBUM',
  releaseDate: new Date('2022-09-16T00:00:00.000Z'),
  label: 'YG Entertainment',
  coverUrl: null,
  description: null,
  spotifyId: null,
  verified: true,
  translations: [{ locale: 'es', title: null, formatLabel: 'Album de estudio', description: null }],
  _count: { tracks: 8 },
  tracks: [
    {
      id: 'trk-1',
      title: 'Pink Venom',
      trackNumber: 1,
      durationSec: null,
      isTitleTrack: true,
      titleLocalized: null,
      spotifyId: null,
      lyricsAvailable: false,
      verified: true,
    },
  ],
};

function prismaDouble() {
  return {
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
    isReachable: vi.fn().mockResolvedValue(true),
    member: {
      findMany: vi.fn().mockResolvedValue([memberRow]),
      findUnique: vi.fn(async ({ where }: { where: { slug: string } }) =>
        where.slug === 'jisoo' ? memberRow : null,
      ),
    },
    album: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([albumRow]),
      findUnique: vi.fn().mockResolvedValue(albumRow),
    },
    track: { findUnique: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]) },
    timelineEvent: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    trivia: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    award: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    quizQuestion: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    soloWork: { findMany: vi.fn().mockResolvedValue([]) },
    soloTrack: { findMany: vi.fn().mockResolvedValue([]) },
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

describe('content-service (e2e)', () => {
  let app: INestApplication;
  let server: unknown;
  let prismaSpy: ReturnType<typeof prismaDouble>;

  beforeAll(async () => {
    prismaSpy = prismaDouble();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaSpy)
      .overrideProvider(CacheService)
      .useValue(cacheDouble())
      .compile();

    app = moduleRef.createNestApplication();
    configureService(app, {
      service: 'content-service',
      title: 'BLACKPINK Fansite - content-service',
      description: 'Contenido del sitio.',
    });
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
  });

  /* ------------------------------------------------------ 1. /health ---- */
  it('GET /health mantiene el contrato compartido y queda fuera de /api', async () => {
    const response = await request(server).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', service: 'content-service' });
  });

  it('GET /health/dependencies queda FUERA de /api y fuera del envelope', async () => {
    // La lista de rutas excluidas del prefijo global se escribia a mano y se
    // quedaba corta al anadir comprobaciones nuevas: la sonda dejaba de
    // encontrarlas sin que nada fallara de forma visible.
    const response = await request(server).get('/health/dependencies').expect(200);

    expect(response.body).toMatchObject({ service: 'content-service', database: 'up' });
    expect(response.body).not.toHaveProperty('data');
  });

  /* --------------------------------------------- 2. /api/v1/members ---- */
  it('GET /api/v1/members responde con el envelope completo', async () => {
    const response = await request(server).get('/api/v1/members').expect(200);

    expect(Object.keys(response.body).sort()).toEqual(['data', 'error', 'meta']);
    expect(response.body.error).toBeNull();
    expect(response.body.meta.service).toBe('content-service');
    expect(response.body.data[0]).toMatchObject({ slug: 'jisoo', position: 'Vocalista' });
  });

  it('el idioma pedido viaja hasta los metadatos de la respuesta', async () => {
    const response = await request(server).get('/api/v1/members?locale=ko').expect(200);
    expect(response.body.meta.locale).toBe('ko');
  });

  it('rechaza un idioma no soportado con 400 y detalle por campo', async () => {
    const response = await request(server).get('/api/v1/members?locale=fr').expect(400);

    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    expect(response.body.error.details[0]).toMatch(/locale/);
  });

  it('rechaza un parametro desconocido en lugar de ignorarlo en silencio', async () => {
    // Sin forbidNonWhitelisted, "?includeUnverifed=true" (con la errata) se
    // ignoraria y el cliente creeria que su filtro se aplico.
    const response = await request(server).get('/api/v1/members?includeUnverifed=true').expect(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
  });

  /* ------------------------------------ Visibilidad de lo no contrastado -- */
  it('por defecto NO pide contenido sin contrastar a la base de datos', async () => {
    await request(server).get('/api/v1/members').expect(200);

    const call = prismaSpy.member.findMany.mock.calls.at(-1)?.[0];
    expect(call?.where).toEqual({ verified: true });
  });

  it('includeUnverified=true levanta el filtro de forma explicita', async () => {
    await request(server).get('/api/v1/members?includeUnverified=true').expect(200);

    const call = prismaSpy.member.findMany.mock.calls.at(-1)?.[0];
    expect(call?.where).toEqual({});
  });

  it('includeUnverified=false es lo mismo que no enviarlo', async () => {
    await request(server).get('/api/v1/members?includeUnverified=false').expect(200);

    const call = prismaSpy.member.findMany.mock.calls.at(-1)?.[0];
    expect(call?.where).toEqual({ verified: true });
  });

  it('rechaza un valor que no sea booleano', async () => {
    const response = await request(server)
      .get('/api/v1/members?includeUnverified=quizas')
      .expect(400);
    expect(response.body.error.details.join(' ')).toMatch(/includeUnverified/);
  });

  it('la busqueda tambien excluye lo no contrastado, en todos los tipos', async () => {
    // Antes solo lo hacia con la cronologia: un album sin contrastar quedaba
    // oculto en /albums pero aparecia al buscarlo. Las dos consultas de lo en
    // solitario (Fase 14) son justo las que se olvidarian, por nuevas.
    await request(server).get('/api/v1/search?q=pink').expect(200);

    for (const spy of [
      prismaSpy.member.findMany,
      prismaSpy.album.findMany,
      prismaSpy.track.findMany,
      prismaSpy.timelineEvent.findMany,
      prismaSpy.soloWork.findMany,
      prismaSpy.soloTrack.findMany,
    ]) {
      expect(spy.mock.calls.at(-1)?.[0]?.where).toMatchObject({ verified: true });
    }

    // Y una cancion en solitario tampoco se cuela si su obra no se publica.
    expect(prismaSpy.soloTrack.findMany.mock.calls.at(-1)?.[0]?.where).toMatchObject({
      soloWork: { verified: true, member: { verified: true } },
    });
  });

  /* --------------------------------------- 3. /api/v1/members/:slug ---- */
  it('GET /api/v1/members/:slug devuelve 404 con la misma forma de cuerpo', async () => {
    const response = await request(server).get('/api/v1/members/nadie').expect(404);

    expect(response.body.data).toBeNull();
    expect(response.body.error).toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    expect(response.body.meta.service).toBe('content-service');
  });

  /* ---------------------------------------------- 4. /api/v1/albums ---- */
  it('GET /api/v1/albums pagina y expone los metadatos de paginacion', async () => {
    const response = await request(server).get('/api/v1/albums?limit=1&page=1').expect(200);

    expect(response.body.meta.pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });
  });

  it('rechaza un limite por encima del techo, que si no seria un ataque gratuito', async () => {
    const response = await request(server).get('/api/v1/albums?limit=100000').expect(400);
    expect(response.body.error.details.join(' ')).toMatch(/limit/);
  });

  it('rechaza un valor de sort que no esta en la lista', async () => {
    await request(server).get('/api/v1/albums?sort=title_random').expect(400);
  });

  /* ---------------------------------------- 5. /api/v1/albums/:slug ---- */
  it('GET /api/v1/albums/:slug incluye la lista de canciones', async () => {
    const response = await request(server).get('/api/v1/albums/born-pink').expect(200);

    expect(response.body.data).toMatchObject({ slug: 'born-pink', year: 2022, trackCount: 8 });
    expect(response.body.data.tracks[0]).toMatchObject({ title: 'Pink Venom', trackNumber: 1 });
  });

  /* ---------------------------------------------- 6. /api/v1/search ---- */
  it('GET /api/v1/search exige un termino de al menos dos caracteres', async () => {
    const response = await request(server).get('/api/v1/search?q=a').expect(400);
    expect(response.body.error.details.join(' ')).toMatch(/dos caracteres/);
  });

  it('GET /api/v1/search sin q devuelve 400, no 500', async () => {
    await request(server).get('/api/v1/search').expect(400);
  });

  /* -------------------------------------------- 7. /api/v1/timeline ---- */
  it('GET /api/v1/timeline rechaza un rango de fechas invertido', async () => {
    const response = await request(server)
      .get('/api/v1/timeline?from=2023-01-01&to=2020-01-01')
      .expect(400);

    expect(response.body.error.code).toBe('BAD_REQUEST');
  });

  it('GET /api/v1/timeline rechaza una fecha que no es una fecha', async () => {
    await request(server).get('/api/v1/timeline?from=ayer').expect(400);
  });

  /* ------------------------------------------------------- 8. /docs ---- */
  it('la especificacion OpenAPI se publica y describe los endpoints', async () => {
    const response = await request(server).get('/docs/json').expect(200);

    expect(response.body.info.title).toContain('content-service');
    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining(['/api/v1/members', '/api/v1/albums', '/api/v1/search']),
    );
  });

  /* ------------------------------------------------- 9. Ruta ausente --- */
  it('una ruta inexistente devuelve 404 con el envelope, no el HTML de Express', async () => {
    const response = await request(server).get('/api/v1/no-existe').expect(404);
    expect(response.body.error.statusCode).toBe(404);
    expect(response.body.meta).toBeDefined();
  });
});
