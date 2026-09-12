// Tiempo de caché de cada endpoint.

export const CACHE_TTL = {
  members: 3600,
  memberDetail: 3600,
  albums: 3600,
  albumDetail: 3600,
  tracks: 3600,
  timeline: 1800,
  trivia: 1800,
  awards: 3600,
  quiz: 900,
  search: 120,
} as const;

export type CacheTtlKey = keyof typeof CACHE_TTL;

export function resolveTtl(key: CacheTtlKey, referenceTtl: number | undefined): number {
  const base = CACHE_TTL[key];
  if (!referenceTtl || referenceTtl <= 0) return base;
  return Math.max(1, Math.round((base * referenceTtl) / 300));
}
