// Lectura y escritura en la caché de Redis.

import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CACHE_OPTIONS, REDIS_CLIENT, type CacheModuleOptions } from './cache.tokens';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
    @Inject(CACHE_OPTIONS) private readonly options: CacheModuleOptions,
  ) {}

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
