// Formato común de las respuestas de la API.

export interface ApiError {
  statusCode: number;
  message: string;
  code: string;
  details?: string[];
}

export interface ApiMeta {
  timestamp: string;
  service: string;
  locale?: string;
  cached?: boolean;
  pagination?: PageMeta;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiEnvelope<T> {
  data: T | null;
  meta: ApiMeta;
  error: ApiError | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const API_ERROR_CODES = [
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'BAD_REQUEST',
  'UPSTREAM_UNAVAILABLE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
