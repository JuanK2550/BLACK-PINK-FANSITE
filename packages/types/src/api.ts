/**
 * ============================================================================
 * CONTRATO DE RESPUESTA DE LA API
 * ============================================================================
 * Todos los servicios responden con la misma forma, siempre:
 *
 *   { "data": ..., "meta": {...}, "error": null }     exito
 *   { "data": null, "meta": {...}, "error": {...} }   fallo
 *
 * Las tres claves aparecen SIEMPRE, incluso a null. Un cliente que tenga que
 * distinguir "la clave no esta" de "la clave vale null" acaba lleno de
 * comprobaciones defensivas; con una forma fija basta con mirar `error`.
 * ============================================================================
 */

/** Error devuelto al cliente. Nunca contiene detalles internos del servidor. */
export interface ApiError {
  /** Codigo HTTP, repetido en el cuerpo para clientes que solo leen el JSON. */
  statusCode: number;
  /** Mensaje apto para mostrar. Nunca una traza ni un mensaje del driver. */
  message: string;
  /** Codigo estable para que el cliente ramifique sin parsear el mensaje. */
  code: string;
  /** Errores de validacion campo a campo, cuando los hay. */
  details?: string[];
}

/** Metadatos que acompanan a toda respuesta. */
export interface ApiMeta {
  /** Momento en que se genero la respuesta, en ISO 8601. */
  timestamp: string;
  /** Servicio que responde. Facilita depurar detras del gateway. */
  service: string;
  /** Idioma con el que se resolvio el contenido, cuando aplica. */
  locale?: string;
  /** Presente solo si la respuesta vino de cache. */
  cached?: boolean;
  /** Presente solo en colecciones paginadas. */
  pagination?: PageMeta;
}

/** Estado de una coleccion paginada. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Envoltorio unico de todas las respuestas. */
export interface ApiEnvelope<T> {
  data: T | null;
  meta: ApiMeta;
  error: ApiError | null;
}

/** Coleccion paginada generica. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Codigos de error estables. El cliente ramifica por estos, nunca por el texto
 * del mensaje, que puede cambiar o traducirse.
 */
export const API_ERROR_CODES = [
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'BAD_REQUEST',
  'UPSTREAM_UNAVAILABLE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
