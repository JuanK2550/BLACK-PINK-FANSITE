import type { UpstreamName } from '../upstream/upstream.service';

/**
 * ============================================================================
 * TABLA DE ENRUTADO
 * ============================================================================
 * El gateway expone un espacio de nombres propio y estable:
 *
 *   /api/v1/content/*  ->  content-service  /api/v1/*
 *   /api/v1/media/*    ->  media-service    /api/v1/*
 *
 * El prefijo se REESCRIBE, no se reenvia. Asi el cliente nunca depende de como
 * estan organizados los servicios por dentro: si manana la discografia se
 * mueve a un servicio nuevo, cambia esta tabla y ninguna URL publica se rompe.
 *
 * Es una LISTA BLANCA, no un comodin. Un gateway que reenvia cualquier ruta es
 * un tunel abierto a los servicios internos: bastaria con adivinar un endpoint
 * de administracion para saltarse el gateway entero.
 * ============================================================================
 */

export interface RouteRule {
  /** Prefijo publico, ya sin `/api/v1`. */
  prefix: string;
  upstream: UpstreamName;
  /** Segundos de cache en el gateway. */
  ttl: number;
  /**
   * Endpoints costosos: llevan un limite de peticiones mas estricto.
   * La busqueda hace cuatro consultas en paralelo por llamada y la seleccion
   * aleatoria no se puede cachear, asi que ambas se pagan enteras cada vez.
   */
  expensive?: boolean;
}

export const ROUTES: RouteRule[] = [
  /* --- content-service ------------------------------------------------- */
  { prefix: '/content/search', upstream: 'content', ttl: 60, expensive: true },
  { prefix: '/content/members', upstream: 'content', ttl: 600 },
  { prefix: '/content/albums', upstream: 'content', ttl: 600 },
  { prefix: '/content/tracks', upstream: 'content', ttl: 600 },
  { prefix: '/content/timeline', upstream: 'content', ttl: 300 },
  { prefix: '/content/trivia', upstream: 'content', ttl: 300 },
  { prefix: '/content/awards', upstream: 'content', ttl: 600 },
  { prefix: '/content/quiz', upstream: 'content', ttl: 120, expensive: true },

  /* --- media-service ---------------------------------------------------- */
  { prefix: '/media/playlists', upstream: 'media', ttl: 600 },
  { prefix: '/media/tracks', upstream: 'media', ttl: 600 },
];

export interface ResolvedRoute {
  rule: RouteRule;
  /** Ruta ya reescrita para el servicio de destino. */
  upstreamPath: string;
}

/**
 * Resuelve una ruta publica. Devuelve null si no esta en la lista blanca.
 *
 * @param publicPath ruta sin `/api/v1`, por ejemplo `/content/members/jisoo`
 */
export function resolveRoute(publicPath: string): ResolvedRoute | null {
  // La coincidencia mas larga primero: `/content/search` debe ganar a un
  // hipotetico `/content` generico.
  const rule = [...ROUTES]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find(
      (candidate) =>
        publicPath === candidate.prefix || publicPath.startsWith(`${candidate.prefix}/`),
    );

  if (!rule) return null;

  // Se quita el nombre del servicio (`/content`, `/media`) y se devuelve el
  // resto bajo el prefijo versionado que esperan los servicios.
  const withoutNamespace = publicPath.replace(/^\/(content|media)/, '');

  return { rule, upstreamPath: `/api/v1${withoutNamespace}` };
}
