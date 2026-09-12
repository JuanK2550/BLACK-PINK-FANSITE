// Arranque del servicio del chatbot.

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { configureService } from '@blackpink/service-core';
import { AppModule } from './app.module';

const SERVICE_NAME = 'chatbot-service';
const DEFAULT_PORT = 4003;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const port = Number(config.get<string>('CHATBOT_SERVICE_PORT') || DEFAULT_PORT);

  configureService(app, {
    service: SERVICE_NAME,
    title: 'BLACKPINK — chatbot (PINKY)',
    description:
      'Asistente conversacional con RAG sobre el contenido PUBLICADO del sitio. ' +
      'No indexa nada con verified: false, igual que la API no lo publica. ' +
      'No recibe ni almacena datos personales.',
  });

  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');

  Logger.log(`escuchando en http://localhost:${port}/health`, SERVICE_NAME);
}

void bootstrap();
