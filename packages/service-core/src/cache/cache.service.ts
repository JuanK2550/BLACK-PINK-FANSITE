import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CACHE_OPTIONS, REDIS_CLIENT, type CacheModuleOptions } from './cache.tokens';

/**
 * Cache de lectura sobre Redis.
 *
 * TRES DECISIONES QUE IMPORTAN:
 *
 * 1. La clave SIEMPRE lleva el idioma. Sin el, la primera peticion en espanol
 *    envenena la cache y el siguiente que pida coreano recibe espanol. Es el
 *    fallo mas facil de cometer y el mas dificil de reproducir.
 *
 * 2. Redis caido NO tumba el servicio. Un fallo de cache degrada el
 *    rendimiento, no la disponibilidad: se registra y se sirve desde la
 *    fuente. Una cache que puede tirar la aplicacion es peor que no tener
 *    cache.
 *
 * 3. El TTL se decide por endpoint, no globalmente. La discografia cambia una
 *    vez al ano y una busqueda cambia con cada consulta.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
    @Inject(CACHE_OPTIONS) private readonly options: CacheModuleOptions,
  ) {}

  /**
   * Construye una clave de cache.
   * Formato: `<servicio>:<recurso>:<locale>:<huella de los parametros>`
   */
  buildKey(resource: string, locale: string | undefined, params: Record<string, unknown> = {}) {
    const normalized = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${String(value)}`)
      .join('&');

    return [this.options.namespace, resource, locale ?? 'none', normalized || 'all'].join(':');
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (error) {
      this.logger.warn(`No se ha podido leer de la cache (${key}): ${describe(error)}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`No se ha podido escribir en la cache (${key}): ${describe(error)}`);
    }
  }

  /**
   * Devuelve el valor cacheado o lo calcula y lo guarda.
   * El segundo elemento dice si venia de cache, para poder reflejarlo en
   * `meta.cached` y poder depurar por que una respuesta esta obsoleta.
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<{ value: T; cached: boolean }> {
    const hit = await this.get<T>(key);
    if (hit !== null) return { value: hit, cached: true };

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return { value, cached: false };
  }

  /** Invalida por prefijo. Usa SCAN, no KEYS: KEYS bloquea el servidor entero. */
  async invalidate(prefix: string): Promise<number> {
    if (!this.redis) return 0;
    const match = `${this.options.namespace}:${prefix}*`;
    let removed = 0;
    let cursor = '0';

    try {
      do {
        const [next, keys] = await this.redis.scan(cursor, 'MATCH', match, 'COUNT', 100);
        cursor = next;
        if (keys.length > 0) {
          removed += await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.warn(`No se ha podido invalidar la cache (${match}): ${describe(error)}`);
    }

    return removed;
  }

  /** true si Redis responde. Lo usa la comprobacion de salud. */
  async isReachable(): Promise<boolean> {
    if (!this.redis) return false;
    try {
      return (await this.redis.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis?.quit().catch(() => undefined);
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
