// Cliente base de la API: peticiones al gateway con reintentos, tiempo límite y caché.

import type { ApiEnvelope, PageMeta } from '@blackpink/types';

const BASE_URL = (
  process.env.API_GATEWAY_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000'
).replace(/\/+$/, '');

const TIMEOUT_MS = 8000;

const INTERNAL_KEY = process.env.INTERNAL_API_KEY;
const IS_SERVER = typeof window === 'undefined';
const RETRIES = 2;

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code: string,
    readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isUnavailable(): boolean {
    return this.statusCode >= 500 || this.code === 'UPSTREAM_UNAVAILABLE';
  }
}

export interface RequestOptions {
  revalidate?: number;
  tags?: string[];
  signal?: AbortSignal;
}

export interface Page<T> {
  items: T[];
  pagination: PageMeta;
}

function buildUrl(path: string, params: Record<string, unknown> = {}): string {
  const url = new URL(`${BASE_URL}/api/v1${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

export async function request<T>(
  path: string,
  params: Record<string, unknown>,
  options: RequestOptions,
): Promise<{ data: T; meta: ApiEnvelope<T>['meta'] }> {
  const url = buildUrl(path, params);
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    // AbortController y no AbortSignal.timeout(): el segundo rompe la caché de fetch de Next.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const onExternalAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          ...(IS_SERVER && INTERNAL_KEY ? { 'x-internal-key': INTERNAL_KEY } : {}),
        },
        next:
          options.revalidate === undefined
            ? undefined
            : { revalidate: options.revalidate, tags: options.tags },
      });

      clearTimeout(timer);

      const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

      if (response.ok && envelope?.data !== undefined && envelope.data !== null) {
        return { data: envelope.data, meta: envelope.meta };
      }

      const error = new ApiError(
        response.status,
        envelope?.error?.message ?? 'La API ha devuelto una respuesta inesperada.',
        envelope?.error?.code ?? 'INTERNAL_ERROR',
        envelope?.error?.details,
      );

      if (response.status < 500) throw error;
      lastError = error;
    } catch (error) {
      clearTimeout(timer);
      if (options.signal?.aborted) throw error;
      if (error instanceof ApiError && error.statusCode < 500) throw error;
      lastError = error;
    } finally {
      options.signal?.removeEventListener('abort', onExternalAbort);
    }

    if (attempt < RETRIES) {
      await delay(2 ** attempt * 150 + Math.random() * 100);
    }
  }

  if (lastError instanceof ApiError) throw lastError;

  throw new ApiError(
    503,
    'No hemos podido conectar con el servidor. Intentalo de nuevo en un momento.',
    'UPSTREAM_UNAVAILABLE',
  );
}

export async function requestPage<T>(
  path: string,
  params: Record<string, unknown>,
  options: RequestOptions,
): Promise<Page<T>> {
  const { data, meta } = await request<T[]>(path, params, options);

  return {
    items: data,
    pagination: meta.pagination ?? {
      page: 1,
      limit: data.length,
      total: data.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const REVALIDATE = {
  content: 3600,
  catalog: 1800,
  media: 3600,
} as const;
