/**
 * TTL de cache por endpoint, en segundos.
 *
 * No hay un TTL global a proposito: la discografia del grupo cambia una vez al
 * ano y una busqueda cambia con cada tecla. Un unico valor obliga a elegir
 * entre servir datos rancios o no cachear nada util.
 *
 * Todos se pueden sobrescribir desde el entorno con CACHE_TTL_SECONDS, que
 * actua como multiplicador de referencia para desplegar con la cache mas
 * agresiva o mas floja sin tocar codigo.
 */
export const CACHE_TTL = {
  /** Fichas de integrante: cambian cuando se edita contenido, casi nunca. */
  members: 3600,
  memberDetail: 3600,
  /** Discografia: practicamente inmutable entre lanzamientos. */
  albums: 3600,
  albumDetail: 3600,
  tracks: 3600,
  /** Cronologia y curiosidades: se amplian de vez en cuando. */
  timeline: 1800,
  trivia: 1800,
  awards: 3600,
  /** Quiz: se cachea la lista, no la seleccion aleatoria. */
  quiz: 900,
  /** Busqueda: muchas claves distintas, TTL corto para no llenar Redis. */
  search: 120,
} as const;

export type CacheTtlKey = keyof typeof CACHE_TTL;

/**
 * Aplica el multiplicador del entorno. `CACHE_TTL_SECONDS` se interpreta como
 * el TTL de referencia (por defecto 300): si se sube a 600, todos los TTL se
 * duplican manteniendo sus proporciones.
 */
export function resolveTtl(key: CacheTtlKey, referenceTtl: number | undefined): number {
  const base = CACHE_TTL[key];
  if (!referenceTtl || referenceTtl <= 0) return base;
  return Math.max(1, Math.round((base * referenceTtl) / 300));
}
