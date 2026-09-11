import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Container, Wordmark } from '@blackpink/ui';

export const metadata: Metadata = {
  title: '404',
  // Una pagina de error no debe aparecer en los resultados de busqueda.
  robots: { index: false, follow: true },
};

/**
 * ============================================================================
 * 404
 * ============================================================================
 * No es una pagina de disculpa: es una pagina de RESCATE. Quien llega aqui ha
 * seguido un enlace roto y lo que necesita es volver a donde iba, no un dibujo
 * triste ni un "¡Ups!".
 *
 * Por eso lleva el indice completo del sitio debajo. Es el mismo sumario de la
 * portada, y convierte un callejon sin salida en un punto de partida.
 *
 * El idioma se lee con `getLocale()` y no de los parametros de ruta: un
 * not-found puede dispararlo `notFound()` desde cualquier profundidad, y
 * tambien una URL que no casa con ninguna pagina, donde no hay params que
 * leer. next-intl lo resuelve igual desde el contexto de la peticion, asi que
 * un 404 en coreano sale en coreano.
 * ============================================================================
 */
export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'Errors' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });
  const home = await getTranslations({ locale, namespace: 'Home' });

  const items = [
    { key: 'grupo', label: nav('grupo'), href: '/grupo' },
    { key: 'integrantes', label: nav('integrantes'), href: '/integrantes' },
    { key: 'discografia', label: nav('discografia'), href: '/discografia' },
    { key: 'cronologia', label: nav('cronologia'), href: '/cronologia' },
    { key: 'curiosidades', label: nav('curiosidades'), href: '/curiosidades' },
    { key: 'playlists', label: nav('playlists'), href: '/playlists' },
    { key: 'premios', label: nav('premios'), href: '/premios' },
    { key: 'galeria', label: nav('galeria'), href: '/galeria' },
    { key: 'quiz', label: nav('quiz'), href: '/quiz' },
  ];

  return (
    <Container width="wide" className="py-section">
      <div className="max-w-prose">
        {/* El codigo va como marca de agua enorme y decorativa: no compite con
            el titular, que es lo que de verdad explica que ha pasado. */}
        <p
          aria-hidden="true"
          className="font-display text-fg/6 select-none text-5xl font-extrabold leading-none"
        >
          404
        </p>

        <h1 className="font-display text-fg mt-6 text-balance text-4xl font-extrabold">
          {t('notFoundTitle')}
        </h1>
        <p className="text-fg-muted mt-4 text-pretty text-lg">{t('notFoundDescription')}</p>
      </div>

      <nav aria-label={home('indexLabel')} className="border-line mt-block border-t pt-6">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {items.map((item) => (
            <li key={item.key}>
              <a
                href={`/${locale}${item.href}`}
                className="text-fg-subtle hover:text-accent-text text-2xs ease-out-soft focus-visible:outline-focus transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-4"
                data-uppercase
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p className="mt-block">
        <a
          href={`/${locale}`}
          className="focus-visible:outline-focus rounded-xs focus-visible:outline-offset-6 inline-block focus-visible:outline-2"
        >
          <Wordmark className="text-2xl" />
        </a>
      </p>
    </Container>
  );
}
