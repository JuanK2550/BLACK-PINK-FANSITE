import type { Params } from 'nestjs-pino';

export interface LoggerOptions {
  service: string;
  level?: string;
  pretty?: boolean;
}

/**
 * Configuracion de pino para todos los servicios.
 *
 * En produccion escribe JSON por linea, que es lo que esperan los agregadores
 * de logs. En desarrollo se puede pedir formato legible, pero NUNCA por
 * defecto: si el formateo bonito se cuela en produccion, los logs dejan de ser
 * analizables justo cuando hacen falta.
 *
 * REDACCION: los campos de la lista se sustituyen por [Redacted] antes de
 * escribir. Una cookie de sesion o una cabecera de autorizacion en un log es
 * una credencial filtrada, y los logs viven mas y en mas sitios que la propia
 * peticion.
 */
/**
 * `pino-pretty` es una dependencia de DESARROLLO. La imagen de produccion se
 * construye con `pnpm deploy --prod`, asi que ahi no existe, y pino no falla
 * de forma suave: revienta el arranque con "unable to determine transport
 * target". Basta con que alguien deje NODE_ENV=development en un contenedor
 * para que el servicio no levante.
 *
 * Se comprueba antes de pedirlo: si no esta, se escribe JSON, que es el
 * comportamiento correcto de todas formas.
 */
function prettyTransportAvailable(): boolean {
  try {
    require.resolve('pino-pretty');
    return true;
  } catch {
    return false;
  }
}

export function buildLoggerConfig({ service, level, pretty = false }: LoggerOptions): Params {
  const usePretty = pretty && prettyTransportAvailable();

  return {
    pinoHttp: {
      name: service,
      level: level ?? 'info',

      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]',
          'req.headers["x-internal-api-key"]',
          'res.headers["set-cookie"]',
        ],
        censor: '[Redacted]',
      },

      // Solo lo util. El objeto completo de request de Express en cada linea
      // de log multiplica el volumen sin anadir informacion.
      serializers: {
        req: (request: {
          id?: string;
          method: string;
          url: string;
          headers?: Record<string, unknown>;
        }) => ({
          id: request.id,
          method: request.method,
          url: request.url,
          locale: readLocale(request.url),
        }),
        res: (response: { statusCode: number }) => ({ statusCode: response.statusCode }),
      },

      customLogLevel: (_request: unknown, response: { statusCode: number }, error?: Error) => {
        if (error || response.statusCode >= 500) return 'error';
        if (response.statusCode >= 400) return 'warn';
        return 'info';
      },

      // Las comprobaciones de salud las llama un orquestador cada pocos
      // segundos: registrarlas solo entierra lo que si importa.
      autoLogging: {
        ignore: (request: { url?: string }) => (request.url ?? '').startsWith('/health'),
      },

      ...(usePretty
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss', singleLine: true },
            },
          }
        : {}),
    },
  };
}

function readLocale(url: string): string | undefined {
  const match = /[?&]locale=([a-z]{2})/i.exec(url);
  return match?.[1];
}
