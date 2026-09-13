// Configuración común de arranque de los servicios.

import { INestApplication, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AllExceptionsFilter } from './envelope/exception.filter';
import { ResponseEnvelopeInterceptor } from './envelope/response.interceptor';
import { applyTrustProxy } from './http/trust-proxy';

export interface ServiceSetupOptions {
  service: string;
  title: string;
  description: string;
  version?: string;
  allowedOrigins?: string[];
}

export function useStructuredLogger(app: INestApplication): void {
  try {
    app.useLogger(app.get(PinoLogger));
  } catch {
    // Sin LoggerModule (algunos tests) se queda el logger de Nest.
  }
}

export function configureService(app: INestApplication, options: ServiceSetupOptions): void {
  useStructuredLogger(app);
  applyTrustProxy(app);

  const logger = new Logger('bootstrap');

  app.setGlobalPrefix('api', { exclude: ['health', 'health/*path', 'docs'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      disableErrorMessages: false,
      validationError: { target: false, value: false },
    }),
  );

  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(options.service));
  app.useGlobalFilters(new AllExceptionsFilter(options.service));

  if (options.allowedOrigins && options.allowedOrigins.length > 0) {
    app.enableCors({ origin: options.allowedOrigins, credentials: true });
  }

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(options.title)
      .setDescription(options.description)
      .setVersion(options.version ?? '1.0.0')
      .build(),
  );

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
  });

  logger.log(`Documentacion OpenAPI en /docs`);
}
