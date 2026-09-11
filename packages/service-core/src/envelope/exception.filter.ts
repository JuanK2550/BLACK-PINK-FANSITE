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

/** Mensaje unico para cualquier fallo no previsto. */
const GENERIC_MESSAGE = 'Se ha producido un error al procesar la peticion.';

/**
 * Mensaje para los 5xx que SI se pueden explicar sin filtrar nada.
 * "Una dependencia no responde" es informacion estructural, no interna: no
 * dice como esta construido el sistema y si le dice al cliente que puede
 * reintentar mas tarde en lugar de dar la peticion por imposible.
 */
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

/**
 * Convierte cualquier excepcion en la misma forma { data, meta, error }.
 *
 * REGLA QUE NO SE NEGOCIA: nada de lo que salga de aqui puede filtrar detalles
 * internos. Una traza, el mensaje de un driver de base de datos o el nombre de
 * una tabla le dicen a un atacante como esta construido el sistema y no le
 * dicen nada util a un usuario. Los 5xx responden siempre con un mensaje
 * generico; el detalle real se escribe en el log del servidor, que es donde
 * sirve de algo.
 *
 * Los 4xx SI conservan su mensaje: describen lo que el cliente hizo mal, y
 * ocultarlo solo lo deja sin saber que corregir.
 */
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
      // El detalle completo va al log, nunca al cuerpo de la respuesta.
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
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

  /**
   * Un 5xx nunca lleva el mensaje original, pero SI conserva su codigo cuando
   * es un fallo conocido. Devolver `INTERNAL_ERROR` para un 503 le quita al
   * cliente la unica pista util que tenia: que el problema es temporal y que
   * reintentar tiene sentido.
   */
  private serverError(exception: unknown, status: number): ApiError {
    const code = STATUS_TO_CODE[status];

    /*
     * El MENSAJE sigue siendo generico -esa regla no se toca-, pero el CODIGO
     * que el servicio declaro explicitamente se conserva.
     *
     * No es una filtracion: un codigo que el propio servicio escribio para el
     * cliente es contrato publico, no un detalle interno. Y el cliente hace
     * cosas distintas con cada uno: ante uno que dice que la funcion no esta
     * disponible esconde el boton, y ante uno temporal ofrece reintentar. Con
     * un unico `UPSTREAM_UNAVAILABLE` para todo tendria que adivinar.
     */
    const declared = declaredCode(exception);

    if (code === 'UPSTREAM_UNAVAILABLE') {
      return { statusCode: status, message: UPSTREAM_MESSAGE, code: declared ?? code };
    }

    return { statusCode: status, message: GENERIC_MESSAGE, code: declared ?? 'INTERNAL_ERROR' };
  }

  /** Extrae el mensaje de un 4xx, incluidos los de class-validator. */
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

    // ValidationPipe devuelve un array con un mensaje por campo invalido.
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
      // El codigo del servicio manda sobre el deducido del estado. Sin esto,
      // un servicio podia declarar `EMPTY_AUDIO` y el cliente recibia
      // `BAD_REQUEST`: el codigo se perdia en silencio y quedaba el mensaje
      // como unica pista, que es justo lo que un codigo evita tener que leer.
      code: declaredCode(exception) ?? code,
    };
  }
}

/**
 * El codigo que el servicio puso a mano al lanzar la excepcion, si lo puso.
 *
 * Solo se acepta una cadena corta en mayusculas: asi un objeto de error de una
 * libreria de terceros, que puede traer un `code` como `ECONNREFUSED` o el
 * numero de error de un driver, no acaba publicandose como si fuera parte del
 * contrato de la API.
 */
function declaredCode(exception: unknown): string | undefined {
  if (!(exception instanceof HttpException)) return undefined;

  const payload = exception.getResponse();
  if (typeof payload !== 'object' || payload === null) return undefined;

  const code = (payload as { code?: unknown }).code;
  if (typeof code !== 'string') return undefined;

  return /^[A-Z][A-Z0-9_]{2,39}$/.test(code) ? code : undefined;
}
