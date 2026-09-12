// Claves de inyección de la caché.

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const CACHE_OPTIONS = Symbol('CACHE_OPTIONS');

export interface CacheModuleOptions {
  namespace: string;
  url?: string;
}
