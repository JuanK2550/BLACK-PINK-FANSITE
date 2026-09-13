// Arranque del servicio de voz.

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { configureService, initSentry } from '@blackpink/service-core';
import { AppModule } from './app.module';

const SERVICE_NAME = 'speech-service';
const DEFAULT_PORT = 4004;

async function bootstrap(): Promise<void> {
  initSentry(SERVICE_NAME);
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const port = Number(config.get<string>('SPEECH_SERVICE_PORT') || DEFAULT_PORT);

  configureService(app, {
    service: SERVICE_NAME,
    title: 'BLACKPINK — transcripcion de voz',
    description:
      'Convierte un audio en texto y no lo almacena: ni en disco, ni en base de datos, ' +
      'ni en los logs. El texto vuelve al navegador para que la persona lo revise antes ' +
      'de enviarlo; este servicio no conversa ni decide nada con lo que oye.',
  });

  app.enableShutdownHooks();
  await app.listen(port, process.env.LISTEN_HOST || '0.0.0.0');

  Logger.log(`escuchando en http://localhost:${port}/health`, SERVICE_NAME);
}

void bootstrap();
