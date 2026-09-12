// Arranque del servicio de medios.

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { configureService } from '@blackpink/service-core';
import { AppModule } from './app.module';

const SERVICE_NAME = 'media-service';
const DEFAULT_PORT = 4002;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const port = Number(config.get<string>('MEDIA_SERVICE_PORT') ?? DEFAULT_PORT);

  configureService(app, {
    service: SERVICE_NAME,
    title: 'BLACKPINK Fansite - media-service',
    description:
      'Playlists curadas y datos de embed. Este servicio NO aloja ni sirve audio ni video: solo devuelve identificadores para incrustar el reproductor oficial de Spotify.',
    version: '1.0.0',
  });

  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');

  Logger.log(`escuchando en http://localhost:${port} (docs en /docs)`, SERVICE_NAME);
}

void bootstrap();
