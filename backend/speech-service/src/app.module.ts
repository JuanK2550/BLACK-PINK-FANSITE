// Módulo raíz del servicio de voz.

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule, type Params } from 'nestjs-pino';
import { buildLoggerConfig } from '@blackpink/service-core';
import { HealthModule } from './health/health.module';
import { ProviderModule } from './provider/provider.module';
import { TranscribeModule } from './transcribe/transcribe.module';

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
          service: 'speech-service',
          level: config.get<string>('LOG_LEVEL'),
          pretty: config.get<string>('NODE_ENV') === 'development',
        });

        return {
          ...base,
          pinoHttp: {
            ...base.pinoHttp,
            autoLogging: { ignore: (req) => (req.url ?? '').startsWith('/health') },
          },
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'speech',
            ttl: Number(config.get<string>('SPEECH_RATE_WINDOW_MS') ?? 600_000),
            limit: Number(config.get<string>('SPEECH_RATE_MAX') ?? 10),
          },
        ],
        skipIf: (context) => {
          const request = context.switchToHttp().getRequest<{ path?: string }>();
          return (request.path ?? '').startsWith('/health');
        },
      }),
    }),

    ProviderModule,
    TranscribeModule,
    HealthModule,
  ],
})
export class AppModule {}
