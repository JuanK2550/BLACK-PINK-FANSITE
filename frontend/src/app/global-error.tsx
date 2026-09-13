// Pantalla de error cuando falla el layout raíz.
'use client';

import { useEffect } from 'react';
import { reportError } from '../lib/report-error';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <html lang="es" data-theme="dark">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          backgroundColor: '#08070a',
          color: '#ffffff',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <main style={{ maxWidth: '38rem' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#a79fb0',
            }}
          >
            <span style={{ color: '#ffffff' }}>BLACK</span>
            <span style={{ color: '#ff2e88' }}>PINK</span>
          </p>

          <h1
            style={{
              margin: '1.5rem 0 0',
              fontSize: 'clamp(1.875rem, 1.4rem + 2vw, 2.75rem)',
              lineHeight: 1.15,
              letterSpacing: '-0.015em',
              fontWeight: 800,
            }}
          >
            Algo se ha roto por nuestra parte
          </h1>

          <p style={{ margin: '1rem 0 0', color: '#a79fb0', lineHeight: 1.65 }}>
            No es culpa tuya. Vuelve a intentarlo; si sigue fallando, recarga la pagina dentro de un
            rato.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem',
              height: '2.75rem',
              padding: '0 1.5rem',
              border: 0,
              borderRadius: '9999px',
              backgroundColor: '#ff2e88',
              color: '#08070a',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>

          {error.digest ? (
            <p style={{ margin: '2rem 0 0', fontSize: '0.75rem', color: '#6e6579' }}>
              {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
