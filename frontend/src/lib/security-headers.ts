// Cabeceras de seguridad de la web: CSP, HSTS, permisos del navegador y noindex en las previews.

export interface SecurityHeaderOptions {
  apiUrl?: string;
  sentryDsn?: string;
  cdnUrl?: string;
  vercelEnv?: string;
  https: boolean;
  development: boolean;
}

export interface Header {
  key: string;
  value: string;
}

const SPOTIFY_PLAYER = 'https://open.spotify.com';
const SPOTIFY_COVERS = 'https://i.scdn.co';
const VERCEL_SCRIPTS = 'https://va.vercel-scripts.com';
const VERCEL_LIVE = 'https://vercel.live';

type Source = string | false | undefined;

function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function isSource(source: Source): source is string {
  return typeof source === 'string' && source.length > 0;
}

export function contentSecurityPolicy(options: SecurityHeaderOptions): string {
  const preview = options.vercelEnv === 'preview';
  const dev = options.development;

  const directives: [string, Source[]][] = [
    ['default-src', ["'self'"]],
    // 'unsafe-inline': las páginas salen estáticas (ISR) y un nonce obligaría a renderizar cada visita.
    [
      'script-src',
      ["'self'", "'unsafe-inline'", dev && "'unsafe-eval'", VERCEL_SCRIPTS, preview && VERCEL_LIVE],
    ],
    ['style-src', ["'self'", "'unsafe-inline'", preview && VERCEL_LIVE]],
    [
      'img-src',
      [
        "'self'",
        'data:',
        'blob:',
        SPOTIFY_COVERS,
        originOf(options.cdnUrl),
        preview && VERCEL_LIVE,
        preview && 'https://vercel.com',
      ],
    ],
    [
      'font-src',
      ["'self'", 'data:', preview && VERCEL_LIVE, preview && 'https://assets.vercel.com'],
    ],
    [
      'connect-src',
      [
        "'self'",
        originOf(options.apiUrl),
        originOf(options.sentryDsn),
        VERCEL_SCRIPTS,
        dev && 'ws:',
        preview && VERCEL_LIVE,
        preview && 'wss://ws-us3.pusher.com',
      ],
    ],
    ['media-src', ["'self'", 'blob:']],
    // Solo el reproductor de Spotify: YouTube está retirado del contrato.
    ['frame-src', [SPOTIFY_PLAYER, preview && VERCEL_LIVE]],
    ['worker-src', ["'self'", 'blob:']],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'"]],
    ['frame-ancestors', ["'none'"]],
  ];

  const policy = directives.map(
    ([name, sources]) => `${name} ${[...new Set(sources.filter(isSource))].join(' ')}`,
  );

  if (options.https) policy.push('upgrade-insecure-requests');

  return policy.join('; ');
}

export function securityHeaders(options: SecurityHeaderOptions): Header[] {
  const headers: Header[] = [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options) },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()',
    },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  ];

  if (options.https) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains',
    });
  }

  if (options.vercelEnv === 'preview') {
    headers.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
  }

  return headers;
}
