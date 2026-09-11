import { INestApplication, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './envelope/exception.filter';
import { ResponseEnvelopeInterceptor } from './envelope/response.interceptor';

export interface ServiceSetupOptions {
  /** Nombre del servicio, tal y como aparece en meta.service y en los logs. */
  service: string;
  title: string;
  description: string;
  version?: string;
  /** Origenes permitidos por CORS. Vacio = no se abre CORS. */
  allowedOrigins?: string[];
}

/**
 * Deja una aplicacion Nest con la misma configuracion en todos los servicios:
 * prefijo y version de la API, validacion estricta, envelope de respuesta,
 * manejo global de errores y Swagger en /docs.
 *
 * Vive aqui y no copiado en cada main.ts porque una configuracion de seguridad
 * duplicada es una configuracion que acaba divergiendo: basta con que un
 * servicio se olvide de `forbidNonWhitelisted` para que acepte entradas que el
 * resto rechaza.
 */
export function configureService(app: INestApplication, options: ServiceSetupOptions): void {
  const logger = new Logger('bootstrap');

  /*
   * Se excluye TODO el arbol de /health con un comodin, no una lista de rutas
   * escritas a mano. Una lista se queda corta en cuanto alguien anade una
   * comprobacion nueva: la ruta se cuela bajo /api, la sonda deja de
   * encontrarla y nadie se entera hasta que un contenedor se reinicia solo.
   */
  app.setGlobalPrefix('api', { exclude: ['health', 'health/*path', 'docs'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      // Descarta lo que no este declarado en el DTO...
      whitelist: true,
      // ...y ademas lo rechaza. Sin esto, un parametro mal escrito se ignora
      // en silencio y el cliente cree que su filtro se ha aplicado.
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      // El cuerpo del 400 nunca lleva el valor recibido: puede contener datos
      // del usuario que no deben acabar en un log de errores.
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
