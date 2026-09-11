import type { PageMeta } from '@blackpink/types';

/**
 * Construye los metadatos de paginacion a partir de lo que ya se sabe.
 *
 * `hasNext` se calcula contra el total y no contra "he recibido tantos
 * elementos como el limite": ese atajo miente justo en el caso frontera, la
 * ultima pagina llena, y hace que el cliente pida una pagina vacia.
 */
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
