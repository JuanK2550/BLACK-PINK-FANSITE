// Lista blanca de rutas que el gateway deja pasar.

import type { UpstreamName } from '../upstream/upstream.service';

export interface RouteRule {
  prefix: string;
  upstream: UpstreamName;
  ttl: number;
  expensive?: boolean;
}

export const ROUTES: RouteRule[] = [
  { prefix: '/content/search', upstream: 'content', ttl: 60, expensive: true },
  { prefix: '/content/members', upstream: 'content', ttl: 600 },
  { prefix: '/content/albums', upstream: 'content', ttl: 600 },
  { prefix: '/content/tracks', upstream: 'content', ttl: 600 },
  { prefix: '/content/timeline', upstream: 'content', ttl: 300 },
  { prefix: '/content/trivia', upstream: 'content', ttl: 300 },
  { prefix: '/content/awards', upstream: 'content', ttl: 600 },
  { prefix: '/content/quiz', upstream: 'content', ttl: 120, expensive: true },

  { prefix: '/media/playlists', upstream: 'media', ttl: 600 },
  { prefix: '/media/tracks', upstream: 'media', ttl: 600 },
];

export interface ResolvedRoute {
  rule: RouteRule;
  upstreamPath: string;
}

export function resolveRoute(publicPath: string): ResolvedRoute | null {
  const rule = [...ROUTES]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find(
      (candidate) =>
        publicPath === candidate.prefix || publicPath.startsWith(`${candidate.prefix}/`),
    );

  if (!rule) return null;

  const withoutNamespace = publicPath.replace(/^\/(content|media)/, '');

  return { rule, upstreamPath: `/api/v1${withoutNamespace}` };
}
