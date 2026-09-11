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
      // .env unico en la raiz del monorepo. En Docker las variables llegan
      // desde docker-compose y este fichero simplemente no existe.
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
            /*
             * EL CUERPO NO SE REGISTRA NUNCA, y aqui no es una preferencia: el
             * cuerpo de estas peticiones es el audio de una persona. pino-http
             * no lo registra por defecto, pero se deja escrito para que nadie
             * lo active «para depurar» sin leer esto antes.
             */
            autoLogging: { ignore: (req) => (req.url ?? '').startsWith('/health') },
          },
        };
      },
    }),

    /*
     * LIMITE DE PETICIONES POR IP.
     *
     * El limitador vive TAMBIEN aqui y no solo en el gateway, al reves que en
     * el resto de servicios. La razon es el coste: una transcripcion gasta
     * cuota compartida de verdad, y este servicio es el unico que sabe cuando
     * se ha gastado. Si alguien alcanzase el servicio saltandose el gateway
     * -en desarrollo, o por un despliegue mal cerrado-, el limite del gateway
     * no protegeria nada.
     *
     * 10 peticiones cada 10 minutos: ver `SpeechThrottlerGuard`.
     */
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
        // Las sondas de Docker preguntan cada pocos segundos: si agotaran la
        // cuota, el orquestador daria el servicio por caido estando sano.
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
