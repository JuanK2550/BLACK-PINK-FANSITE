export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const CACHE_OPTIONS = Symbol('CACHE_OPTIONS');

export interface CacheModuleOptions {
  /** Prefijo de todas las claves. Normalmente el nombre del servicio. */
  namespace: string;
  /** URL de Redis. Si falta, la cache queda desactivada y el servicio sigue. */
  url?: string;
}
