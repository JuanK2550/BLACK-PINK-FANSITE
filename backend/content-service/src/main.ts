// Arranque del servicio de contenido.

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { configureService, initSentry } from '@blackpink/service-core';
import { AppModule } from './app.module';

const SERVICE_NAME = 'content-service';
const DEFAULT_PORT = 4001;

async function bootstrap(): Promise<void> {
  initSentry(SERVICE_NAME);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const port = Number(config.get<string>('CONTENT_SERVICE_PORT') ?? DEFAULT_PORT);

  configureService(app, {
    service: SERVICE_NAME,
    title: 'BLACKPINK Fansite - content-service',
    description:
      'Integrantes, discografia, cronologia, curiosidades, premios y quiz. Todo el contenido lleva `source` y `verified`: por defecto solo se sirve lo contrastado.',
    version: '1.0.0',
  });

  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');

  Logger.log(`escuchando en http://localhost:${port} (docs en /docs)`, SERVICE_NAME);
}

void bootstrap();
