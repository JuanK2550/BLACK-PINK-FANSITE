import {
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { ApiEnvelope } from '@blackpink/types';
import { describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter } from './envelope/exception.filter';
import { buildPageMeta } from './pagination/paginate';
import { CacheService } from './cache/cache.service';

/* ==========================================================================
 * Paginacion
 * ======================================================================= */

describe('buildPageMeta', () => {
  it('calcula el total de paginas redondeando hacia arriba', () => {
    expect(buildPageMeta(21, 1, 10).totalPages).toBe(3);
  });

  it('la ultima pagina llena NO declara que hay siguiente', () => {
    // El caso frontera: 20 elementos, limite 10, pagina 2. Un `hasNext`
    // calculado como "he recibido tantos como el limite" mentiria aqui.
    expect(buildPageMeta(20, 2, 10).hasNext).toBe(false);
  });

  it('la primera pagina no declara anterior', () => {
    expect(buildPageMeta(50, 1, 10).hasPrevious).toBe(false);
  });

  it('una coleccion vacia no tiene paginas ni siguiente', () => {
    expect(buildPageMeta(0, 1, 20)).toMatchObject({ totalPages: 0, hasNext: false });
  });
});

/* ==========================================================================
 * Cache
 * ======================================================================= */

function cacheService(redis: unknown = null) {
  return new CacheService(redis as never, { namespace: 'test' });
}

describe('CacheService', () => {
  it('el idioma SIEMPRE forma parte de la clave', () => {
    const cache = cacheService();
    const es = cache.buildKey('members', 'es', {});
    const ko = cache.buildKey('members', 'ko', {});

    expect(es).not.toBe(ko);
    expect(es).toContain(':es:');
    expect(ko).toContain(':ko:');
  });

  it('ordena los parametros: el mismo filtro produce la misma clave', () => {
    const cache = cacheService();
    expect(cache.buildKey('albums', 'es', { type: 'EP', page: 2 })).toBe(
      cache.buildKey('albums', 'es', { page: 2, type: 'EP' }),
    );
  });

  it('ignora los parametros vacios en lugar de generar claves distintas', () => {
    const cache = cacheService();
    expect(cache.buildKey('albums', 'es', { type: undefined, page: 1 })).toBe(
      cache.buildKey('albums', 'es', { page: 1 }),
    );
  });

  it('sin Redis sigue funcionando: calcula el valor y no falla', async () => {
    const cache = cacheService();
    const factory = vi.fn().mockResolvedValue({ ok: true });

    const result = await cache.getOrSet('k', 60, factory);

    expect(result).toEqual({ value: { ok: true }, cached: false });
    expect(factory).toHaveBeenCalledOnce();
  });

  it('un fallo de Redis degrada el rendimiento, no la disponibilidad', async () => {
    const redis = {
      get: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      set: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    };
    const cache = cacheService(redis);

    const result = await cache.getOrSet('k', 60, async () => 'desde la base');

    expect(result.value).toBe('desde la base');
    expect(result.cached).toBe(false);
  });

  it('devuelve el valor cacheado marcandolo como tal', async () => {
    const redis = { get: vi.fn().mockResolvedValue(JSON.stringify({ hit: 1 })) };
    const factory = vi.fn();

    const result = await cacheService(redis).getOrSet('k', 60, factory);

    expect(result).toEqual({ value: { hit: 1 }, cached: true });
    expect(factory).not.toHaveBeenCalled();
  });
});

/* ==========================================================================
 * Manejo de errores
 * ======================================================================= */

function captureResponse() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'GET', url: '/api/v1/members' }),
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json, body: () => json.mock.calls[0]?.[0] as ApiEnvelope<never> };
}

describe('AllExceptionsFilter', () => {
  it('un 5xx NUNCA filtra el mensaje interno', () => {
    const capture = captureResponse();
    new AllExceptionsFilter('content-service').catch(
      new InternalServerErrorException('relation "members" does not exist'),
      capture.host,
    );

    const body = capture.body();
    expect(capture.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.error?.message).not.toContain('members');
    expect(body.error?.code).toBe('INTERNAL_ERROR');
  });

  it('un error desconocido tampoco se filtra', () => {
    const capture = captureResponse();
    new AllExceptionsFilter('content-service').catch(
      new Error('connect ECONNREFUSED 127.0.0.1:5433'),
      capture.host,
    );

    expect(capture.body().error?.message).not.toContain('5433');
  });

  it('un 404 SI conserva su mensaje: describe lo que el cliente pidio mal', () => {
    const capture = captureResponse();
    new AllExceptionsFilter('content-service').catch(
      new NotFoundException('No existe ninguna integrante con el identificador "nadie".'),
      capture.host,
    );

    expect(capture.body().error).toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'No existe ninguna integrante con el identificador "nadie".',
    });
  });

  it('los errores de validacion salen campo a campo', () => {
    const capture = captureResponse();
    new AllExceptionsFilter('content-service').catch(
      new BadRequestException({ message: ['locale debe ser uno de: es, en, ko.'] }),
      capture.host,
    );

    expect(capture.body().error).toMatchObject({
      code: 'VALIDATION_FAILED',
      details: ['locale debe ser uno de: es, en, ko.'],
    });
  });

  it('el cuerpo de error mantiene la misma forma que el de exito', () => {
    const capture = captureResponse();
    new AllExceptionsFilter('media-service').catch(new NotFoundException('nada'), capture.host);

    const body = capture.body();
    expect(Object.keys(body).sort()).toEqual(['data', 'error', 'meta']);
    expect(body.data).toBeNull();
    expect(body.meta.service).toBe('media-service');
  });
});
