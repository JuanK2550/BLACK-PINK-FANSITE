// Convierte los errores al formato común de respuesta.

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiEnvelope, ApiError, ApiErrorCode } from '@blackpink/types';
import type { Request, Response } from 'express';
import { captureServerError } from '../observability/sentry';

const GENERIC_MESSAGE = 'Se ha producido un error al procesar la peticion.';

const UPSTREAM_MESSAGE = 'Un servicio del que depende esta peticion no esta disponible.';

const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_FAILED',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.BAD_GATEWAY]: 'UPSTREAM_UNAVAILABLE',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'UPSTREAM_UNAVAILABLE',
  [HttpStatus.GATEWAY_TIMEOUT]: 'UPSTREAM_UNAVAILABLE',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly serviceName: string) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const error: ApiError =
      status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? this.serverError(exception, status)
        : this.clientError(exception, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      // 502-504 son caídas de otro servicio: las avisa el monitor, no son un fallo de código.
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) captureServerError(exception, status);
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${status}: ${error.message}`);
    }

    const body: ApiEnvelope<never> = {
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        service: this.serviceName,
      },
      error,
    };

    response.status(status).json(body);
  }

  private serverError(exception: unknown, status: number): ApiError {
    const code = STATUS_TO_CODE[status];

    const declared = declaredCode(exception);

    if (code === 'UPSTREAM_UNAVAILABLE') {
      return { statusCode: status, message: UPSTREAM_MESSAGE, code: declared ?? code };
    }

    return { statusCode: status, message: GENERIC_MESSAGE, code: declared ?? 'INTERNAL_ERROR' };
  }

  private clientError(exception: unknown, status: number): ApiError {
    const code = STATUS_TO_CODE[status] ?? 'BAD_REQUEST';

    if (!(exception instanceof HttpException)) {
      return { statusCode: status, message: GENERIC_MESSAGE, code };
    }

    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { statusCode: status, message: payload, code };
    }

    const record = payload as { message?: string | string[]; error?: string };

    if (Array.isArray(record.message)) {
      return {
        statusCode: status,
        message: 'La peticion no es valida.',
        code: 'VALIDATION_FAILED',
        details: record.message,
      };
    }

    return {
      statusCode: status,
      message: record.message ?? record.error ?? GENERIC_MESSAGE,
      code: declaredCode(exception) ?? code,
    };
  }
}

function declaredCode(exception: unknown): string | undefined {
  if (!(exception instanceof HttpException)) return undefined;

  const payload = exception.getResponse();
  if (typeof payload !== 'object' || payload === null) return undefined;

  const code = (payload as { code?: unknown }).code;
  if (typeof code !== 'string') return undefined;

  return /^[A-Z][A-Z0-9_]{2,39}$/.test(code) ? code : undefined;
}
