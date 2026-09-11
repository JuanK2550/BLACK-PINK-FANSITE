import { Test } from '@nestjs/testing';
import { VersioningType, type INestApplication } from '@nestjs/common';
import {
  AllExceptionsFilter,
  CacheService,
  ResponseEnvelopeInterceptor,
} from '@blackpink/service-core';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { UpstreamService } from '../src/upstream/upstream.service';

/**
 * ============================================================================
 * TESTS E2E DEL API GATEWAY
 * ============================================================================
 * El gateway era el unico servicio sin un test que le hablara por HTTP, y es
 * justo la PUERTA del sistema: lo que deja pasar aqui llega a los servicios
 * internos. Estos tests levantan la aplicacion Nest completa y le hablan con
 * supertest, asi que ejercitan el enrutado, el versionado, la lista blanca,
 * el envelope y el filtro de errores de verdad.
 *
 * LOS SERVICIOS DE DETRAS SE SIMULAN: se sustituye `UpstreamService`. Es la
 * misma regla que el resto de e2e del monorepo —un test que necesita otros
 * cinco procesos levantados acaba desactivado— y ademas permite comprobar lo
 * que NO debe ocurrir: que una ruta fuera de la lista blanca no llegue ni a
 * intentar la llamada.
 *
 * Se replica la configuracion global de `main.ts` (prefijo, versionado,
 * envelope y filtro) porque `createNestApplication` no ejecuta `main.ts`: sin
 * replicarla, el test probaria otra aplicacion.
 * ============================================================================
 */

const upstream = {
  get: vi.fn(),
  probe: vi.fn().mockResolvedValue({ up: true, latencyMs: 3 }),
};

/** Cache que nunca acierta: cada peticion recorre el camino completo. */
function cacheDouble() {
  return {
    buildKey: (resource: string, locale: string | undefined, params: unknown) =>
      `${resource}:${locale ?? '-'}:${JSON.stringify(params)}`,
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    wrap: vi.fn(async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
    isReady: vi.fn().mockReturnValue(false),
  };
}

let app: INestApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(UpstreamService)
    .useValue(upstream)
    .overrideProvider(CacheService)
    .useValue(cacheDouble())
    .compile();

  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api', { exclude: ['health', 'health/*path', 'docs'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor('api-gateway'));
  app.useGlobalFilters(new AllExceptionsFilter('api-gateway'));
  await app.init();
});

afterAll(async () => {
  await app?.close();
});

beforeEach(() => {
  upstream.get.mockReset();
  upstream.get.mockResolvedValue({
    status: 200,
    body: { data: [{ slug: 'jisoo' }], meta: {}, error: null },
    cached: false,
    stale: false,
  });
});

describe('GET /health', () => {
  it('responde fuera de /api y fuera del envelope, con esa forma exacta', async () => {
    // Los HEALTHCHECK de Docker dependen de esta forma: un envelope alrededor
    // o un /v1 delante y las sondas empiezan a dar 404 en silencio.
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', service: 'api-gateway' });
  });

  it('no existe bajo /api/v1', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(404);
  });
});

describe('proxy: lista blanca', () => {
  it('reenvia una ruta permitida al servicio correcto, reescribiendo el prefijo', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/content/members?locale=ko')
      .expect(200);

    expect(upstream.get).toHaveBeenCalledTimes(1);
    const [destino, ruta, query, , locale] = upstream.get.mock.calls[0]!;
    expect(destino).toBe('content');
    // `/content/members` -> `/api/v1/members`: el cliente no sabe como estan
    // organizados los servicios por dentro.
    expect(ruta).toBe('/api/v1/members');
    expect(query).toBe('locale=ko');
    // El idioma viaja a la clave de cache: sin el, la primera peticion en un
    // idioma envenena la cache de los demas.
    expect(locale).toBe('ko');

    expect(res.headers['x-gateway-upstream']).toBe('content');
    expect(res.headers['x-gateway-cache']).toBe('MISS');
  });

  it('una ruta FUERA de la lista da 404 y NO llega a llamar al servicio', async () => {
    // Un gateway que reenvia cualquier ruta es un tunel abierto: bastaria con
    // adivinar un endpoint de administracion para saltarselo entero.
    const res = await request(app.getHttpServer()).get('/api/v1/content/admin/users').expect(404);

    expect(upstream.get).not.toHaveBeenCalled();
    expect(res.body.data).toBeNull();
    expect(res.body.error.statusCode).toBe(404);
  });

  it('un servicio que no esta en la tabla tampoco pasa', async () => {
    await request(app.getHttpServer()).get('/api/v1/chat-admin/logs').expect(404);
    expect(upstream.get).not.toHaveBeenCalled();
  });

  it('solo reenvia lecturas: un POST al proxy general es 404', async () => {
    await request(app.getHttpServer()).post('/api/v1/content/members').send({}).expect(404);
    expect(upstream.get).not.toHaveBeenCalled();
  });

  it('el prefijo /content no se puede usar para colarse en media', async () => {
    await request(app.getHttpServer()).get('/api/v1/content/playlists').expect(404);
    expect(upstream.get).not.toHaveBeenCalled();
  });
});

describe('proxy: circuito abierto', () => {
  it('la copia de respaldo va marcada como caducada y sin cache en el navegador', async () => {
    upstream.get.mockResolvedValue({
      status: 200,
      body: { data: [], meta: {}, error: null },
      cached: true,
      stale: true,
    });

    const res = await request(app.getHttpServer()).get('/api/v1/content/albums').expect(200);
    expect(res.headers['x-gateway-stale']).toBe('true');
    // Si el navegador guardara esto como fresco, seguiria viendo datos viejos
    // despues de que el servicio volviera.
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('transporta el estado del servicio tal cual: un 404 de dentro es un 404 fuera', async () => {
    upstream.get.mockResolvedValue({
      status: 404,
      body: { data: null, meta: {}, error: { statusCode: 404, message: 'No existe' } },
      cached: false,
      stale: false,
    });

    const res = await request(app.getHttpServer()).get('/api/v1/content/members/nadie').expect(404);
    expect(res.body.error.message).toBe('No existe');
  });
});

describe('errores', () => {
  it('un 5xx NUNCA devuelve el mensaje interno', async () => {
    upstream.get.mockRejectedValue(new Error('ECONNREFUSED 10.0.0.12:5432 password=hunter2'));

    const res = await request(app.getHttpServer()).get('/api/v1/content/members');
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
    expect(JSON.stringify(res.body)).not.toContain('10.0.0.12');
  });

  it('la cabecera x-request-id se devuelve para poder seguir una peticion', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/content/members')
      .set('x-request-id', 'rastro-123')
      .expect(200);
    expect(res.headers['x-request-id']).toBe('rastro-123');
  });
});
