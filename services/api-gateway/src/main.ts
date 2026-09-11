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
  // Se tipa como aplicacion Express: useBodyParser y los middlewares de
  // helmet y compression viven en esa interfaz, no en la generica.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const port = Number(config.get<string>('API_GATEWAY_PORT') ?? DEFAULT_PORT);

  /*
   * ==========================================================================
   * SEGURIDAD DE CABECERAS
   * ==========================================================================
   * La politica de contenido por defecto de helmet esta pensada para paginas
   * HTML y aqui estorba: este servicio devuelve JSON y sirve Swagger, que
   * necesita estilos y scripts en linea. Se desactiva esa parte y se conservan
   * el resto de cabeceras, que son las que importan para una API.
   */
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      // Una API publica de solo lectura no debe aparecer en marcos ajenos.
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  /*
   * COMPRESION. Express negocia gzip o deflate segun lo que acepte el cliente.
   * Brotli no lo cubre este middleware: en produccion lo aporta el proxy de
   * delante (Vercel, Railway o Cloudflare), que ademas lo hace fuera del
   * proceso de Node y por tanto sin gastar su CPU. Documentado aqui para que
   * nadie lo tome por un olvido.
   */
  app.use(compression({ threshold: 1024 }));

  /*
   * LIMITE DE TAMANO DEL CUERPO. El gateway solo acepta lecturas, asi que un
   * cuerpo grande no tiene ningun uso legitimo: 64 KB sobra para cualquier
   * peticion valida y corta de raiz el envio de cargas enormes.
   */
  const bodyLimit = config.get<string>('BODY_LIMIT') ?? '64kb';
  app.useBodyParser('json', { limit: bodyLimit });
  app.useBodyParser('urlencoded', { limit: bodyLimit, extended: true });

  /* --- Prefijo, version y validacion ------------------------------------ */
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

  /*
   * CORS POR LISTA BLANCA. Nunca `origin: true`, que refleja cualquier origen
   * y equivale a no tener CORS. Si la lista esta vacia se cierra: fallar
   * cerrado es la unica opcion segura cuando falta configuracion.
   */
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

  /* --- Documentacion unificada ------------------------------------------ */
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
