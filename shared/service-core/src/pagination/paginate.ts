// Calcula los metadatos de paginación.

import type { PageMeta } from '@blackpink/types';

export function buildPageMeta(total: number, page: number, limit: number): PageMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}
