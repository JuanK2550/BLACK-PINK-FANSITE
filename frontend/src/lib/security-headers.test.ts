// Pruebas de las cabeceras de seguridad de la web.

import { describe, expect, it } from 'vitest';
import {
  contentSecurityPolicy,
  securityHeaders,
  type SecurityHeaderOptions,
} from './security-headers';

const production: SecurityHeaderOptions = {
  apiUrl: 'https://api.blackpink.example/',
  sentryDsn: 'https://clave@o1.ingest.us.sentry.io/2',
  vercelEnv: 'production',
  https: true,
  development: false,
};

const local: SecurityHeaderOptions = {
  apiUrl: 'http://localhost:4000',
  https: false,
  development: false,
};

function directive(policy: string, name: string): string {
  return policy.split('; ').find((entry) => entry.startsWith(`${name} `)) ?? '';
}

function header(options: SecurityHeaderOptions, key: string): string | undefined {
  return securityHeaders(options).find((entry) => entry.key === key)?.value;
}

describe('contentSecurityPolicy', () => {
  it('solo deja incrustar el reproductor de Spotify', () => {
    const policy = contentSecurityPolicy(production);
    expect(directive(policy, 'frame-src')).toBe('frame-src https://open.spotify.com');
    expect(policy).not.toContain('youtube');
  });

  it('permite llamar al gateway y a Sentry sin copiar la clave del DSN', () => {
    const connect = directive(contentSecurityPolicy(production), 'connect-src');
    expect(connect).toContain('https://api.blackpink.example');
    expect(connect).toContain('https://o1.ingest.us.sentry.io');
    expect(connect).not.toContain('clave');
  });

  it('las portadas se cargan desde la CDN de Spotify', () => {
    expect(directive(contentSecurityPolicy(production), 'img-src')).toContain('https://i.scdn.co');
  });

  it('nadie puede enmarcar el sitio', () => {
    expect(directive(contentSecurityPolicy(production), 'frame-ancestors')).toBe(
      "frame-ancestors 'none'",
    );
    expect(header(production, 'X-Frame-Options')).toBe('DENY');
  });

  it('eval solo existe en desarrollo', () => {
    expect(contentSecurityPolicy(production)).not.toContain("'unsafe-eval'");
    expect(contentSecurityPolicy({ ...local, development: true })).toContain("'unsafe-eval'");
  });

  it('una URL mal escrita no rompe la política', () => {
    const connect = directive(
      contentSecurityPolicy({ ...local, apiUrl: 'no es una url' }),
      'connect-src',
    );
    expect(connect).toBe("connect-src 'self' https://va.vercel-scripts.com");
  });
});

describe('securityHeaders', () => {
  it('HSTS y la subida a https solo cuando el sitio va por https', () => {
    expect(header(production, 'Strict-Transport-Security')).toContain('max-age=63072000');
    expect(contentSecurityPolicy(production)).toContain('upgrade-insecure-requests');

    expect(header(local, 'Strict-Transport-Security')).toBeUndefined();
    expect(contentSecurityPolicy(local)).not.toContain('upgrade-insecure-requests');
  });

  it('las previews no se indexan y admiten la barra de Vercel', () => {
    const preview = { ...production, vercelEnv: 'preview' };
    expect(header(preview, 'X-Robots-Tag')).toBe('noindex, nofollow');
    expect(directive(contentSecurityPolicy(preview), 'frame-src')).toContain('https://vercel.live');
    expect(header(production, 'X-Robots-Tag')).toBeUndefined();
  });

  it('el micrófono solo para el propio sitio, la cámara para nadie', () => {
    const permissions = header(production, 'Permissions-Policy') ?? '';
    expect(permissions).toContain('microphone=(self)');
    expect(permissions).toContain('camera=()');
  });
});
