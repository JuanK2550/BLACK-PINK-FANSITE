// Arranque del gateway: seguridad, CORS y documentación.

import 'reflect-metadata';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter, ResponseEnvelopeInterceptor } from '@blackpink/service-core';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupAggregateDocs } from './docs/aggregate-docs';

const SERVICE_NAME = 'api-gateway';
const DEFAULT_PORT = 4000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const port = Number(config.get<string>('API_GATEWAY_PORT') ?? DEFAULT_PORT);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  app.use(compression({ threshold: 1024 }));

  const bodyLimit = config.get<string>('BODY_LIMIT') ?? '64kb';
  app.useBodyParser('json', { limit: bodyLimit });
  app.useBodyParser('urlencoded', { limit: bodyLimit, extended: true });

  app.setGlobalPrefix('api', { exclude: ['health', 'health/*path', 'docs'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false, value: false },
    }),
  );

  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(SERVICE_NAME));
  app.useGlobalFilters(new AllExceptionsFilter(SERVICE_NAME));

  const origins = (config.get<string>('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    Logger.warn(
      'ALLOWED_ORIGINS esta vacio: no se permite ningun origen de navegador. ' +
        'Rellena la variable en el .env.',
      SERVICE_NAME,
    );
  }

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['content-type', 'accept', 'accept-language', 'x-request-id'],
    exposedHeaders: ['x-request-id', 'x-gateway-cache', 'x-gateway-stale'],
    maxAge: 600,
  });

  const base = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('BLACKPINK Fansite - API')
      .setDescription(
        'Puerta de entrada unica del sitio. Enruta a content-service y a media-service, ' +
          'cachea las lecturas y aplica limites por IP.\n\n' +
          'Todo el contenido excluye por defecto lo que tiene `verified: false`; ' +
          '`?includeUnverified=true` es de uso interno.\n\n' +
          'El sitio no aloja audio ni video: los endpoints de media solo devuelven ' +
          'identificadores para incrustar los reproductores oficiales.',
      )
      .setVersion('1.0.0')
      .build(),
  );

  await setupAggregateDocs(
    app,
    base,
    [
      {
        name: 'content-service',
        url: config.get<string>('CONTENT_SERVICE_URL') ?? 'http://localhost:4001',
        namespace: 'content',
      },
      {
        name: 'media-service',
        url: config.get<string>('MEDIA_SERVICE_URL') ?? 'http://localhost:4002',
        namespace: 'media',
      },
    ],
    Number(config.get<string>('UPSTREAM_TIMEOUT_MS') ?? 4000),
  );

  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');

  Logger.log(`escuchando en http://localhost:${port} (docs en /docs)`, SERVICE_NAME);
}

void bootstrap();
