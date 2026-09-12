// Página 404 con enlaces para volver al sitio.

import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Container, Wordmark } from '@blackpink/ui';

export const metadata: Metadata = {
  title: '404',
  robots: { index: false, follow: true },
};

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
