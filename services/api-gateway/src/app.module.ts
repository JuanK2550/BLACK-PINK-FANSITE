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
            /*
             * Los logs se correlacionan por el identificador de peticion, no
             * por un contador propio de pino: ese identificador es el mismo
             * que viaja a los servicios y vuelve al cliente, asi que una
             * incidencia se sigue por los tres procesos con una sola cadena.
             */
            genReqId: (request) => (request.headers[REQUEST_ID_HEADER] as string | undefined) ?? '',
          },
        };
      },
    }),

    /*
     * LIMITE DE PETICIONES POR IP.
     *
     * Dos reglas con nombre. La general cubre todo; la estricta se aplica solo
     * donde un decorador la invoca (busqueda y quiz), porque son las llamadas
     * que no se pueden cachear y cuestan varias consultas cada una.
     *
     * El limitador vive en el gateway y no en cada servicio: es el unico punto
     * expuesto al navegador, y repetirlo detras solo multiplicaria la
     * configuracion sin anadir proteccion.
     */
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
        // Las sondas de salud las llama un orquestador cada pocos segundos:
        // limitarlas provocaria reinicios en cascada por falsos negativos.
        /*
         * Dos exenciones del limite de peticiones, y las dos por la misma
         * razon: el limite existe para frenar el ABUSO desde fuera, no para
         * estrangular al propio sistema.
         *
         * 1. `/health`. Las sondas de Docker preguntan cada pocos segundos; si
         *    agotaran la cuota, el orquestador daria el servicio por caido
         *    justo cuando esta sano.
         *
         * 2. Las llamadas INTERNAS del renderizado del frontend. Next pide
         *    desde el servidor, asi que TODAS las peticiones de todos los
         *    visitantes llegan con la misma IP. Sin esta exencion, el limite
         *    por IP se aplica al sitio entero en vez de a cada visitante: con
         *    la internacionalizacion, un build prerenderiza 59 paginas en
         *    segundos y se corta a si mismo a mitad.
         *
         * La exencion NO es por IP -una IP se falsifica- sino por un secreto
         * compartido que solo conoce el servidor. Si no hay secreto
         * configurado, no hay exencion posible: la ausencia de configuracion
         * nunca debe abrir una puerta.
         */
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
    // Antes que nada: el identificador tiene que existir para el primer log.
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
