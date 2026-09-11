import { Global, Logger, Module, type DynamicModule } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CacheService } from './cache.service';
import { CACHE_OPTIONS, REDIS_CLIENT, type CacheModuleOptions } from './cache.tokens';

/**
 * Modulo de cache.
 *
 * Si no hay URL de Redis, el modulo se monta igual con un cliente nulo y
 * CacheService se convierte en un no-op. Asi los tests y el arranque en local
 * sin Redis funcionan sin condicionales repartidos por los servicios.
 */
@Global()
@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions): DynamicModule {
    const logger = new Logger(CacheModule.name);

    return {
      module: CacheModule,
      providers: [
        { provide: CACHE_OPTIONS, useValue: options },
        {
          provide: REDIS_CLIENT,
          useFactory: (): Redis | null => {
            if (!options.url) {
              logger.warn('Sin REDIS_URL: la cache queda desactivada.');
              return null;
            }

            const client = new Redis(options.url, {
              // Sin esto, ioredis reintenta indefinidamente y el arranque del
              // servicio se queda colgado cuando Redis no esta.
              maxRetriesPerRequest: 2,
              enableOfflineQueue: false,
              lazyConnect: false,
              retryStrategy: (times) => Math.min(times * 200, 3000),
            });

            client.on('error', (error: Error) => {
              logger.warn(`Redis no responde: ${error.message}`);
            });

            return client;
          },
        },
        CacheService,
      ],
      exports: [CacheService],
    };
  }
}
