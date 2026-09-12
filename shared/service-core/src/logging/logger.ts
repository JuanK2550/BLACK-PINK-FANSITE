// Configuración de los logs (pino).

import type { Params } from 'nestjs-pino';

export interface LoggerOptions {
  service: string;
  level?: string;
  pretty?: boolean;
}

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
