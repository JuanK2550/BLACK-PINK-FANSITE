// Módulo raíz del gateway.

import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule, type Params } from 'nestjs-pino';
import { CacheModule, buildLoggerConfig } from '@blackpink/service-core';
import { REQUEST_ID_HEADER, RequestIdMiddleware } from './common/request-id.middleware';
import { INTERNAL_KEY_HEADER, timingSafeEqualStrings } from './common/internal-key';
import { HealthModule } from './health/health.module';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['../../.env', '.env'],
    }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): Params => {
        const base = buildLoggerConfig({
          service: 'api-gateway',
          level: config.get<string>('LOG_LEVEL'),
          pretty: config.get<string>('NODE_ENV') === 'development',
        });

        return {
          ...base,
          pinoHttp: {
            ...base.pinoHttp,
            genReqId: (request) => (request.headers[REQUEST_ID_HEADER] as string | undefined) ?? '',
          },
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: Number(config.get<string>('RATE_LIMIT_WINDOW_MS') ?? 60_000),
            limit: Number(config.get<string>('RATE_LIMIT_MAX') ?? 100),
          },
          {
            name: 'expensive',
            ttl: Number(config.get<string>('RATE_LIMIT_WINDOW_MS') ?? 60_000),
            limit: Number(config.get<string>('RATE_LIMIT_EXPENSIVE_MAX') ?? 20),
          },
        ],
        skipIf: (context) => {
          const request = context
            .switchToHttp()
            .getRequest<{ path?: string; headers?: Record<string, unknown> }>();

          if ((request.path ?? '').startsWith('/health')) return true;

          const expected = config.get<string>('INTERNAL_API_KEY');
          if (!expected) return false;

          const provided = request.headers?.[INTERNAL_KEY_HEADER];
          return typeof provided === 'string' && timingSafeEqualStrings(provided, expected);
        },
      }),
    }),

    CacheModule.forRoot({ namespace: 'gateway', url: process.env.REDIS_URL }),

    ProxyModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
