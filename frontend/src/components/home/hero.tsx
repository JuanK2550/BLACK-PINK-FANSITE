// Portada del inicio.

import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { Locale } from '@blackpink/types';
import { Container } from '@blackpink/ui';
import { HERO_IMAGE } from '../../data/media';
import { HeroReveal } from './hero-reveal';

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });

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
    <section className="relative isolate flex min-h-[calc(100svh-var(--spacing-header))] flex-col justify-end overflow-hidden pb-8 pt-16">
      {HERO_IMAGE ? (
        <div className="absolute inset-0 -z-10">
          <Image
            src={HERO_IMAGE.src}
            alt={HERO_IMAGE.alt}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: HERO_IMAGE.position ?? 'center' }}
          />
          <div className="from-canvas via-canvas/75 to-canvas/25 absolute inset-0 bg-gradient-to-t" />
        </div>
      ) : null}

      <Container width="wide">
        <HeroReveal
          lead={t('lead')}
          ctaPrimary={t('ctaPrimary')}
          ctaSecondary={t('ctaSecondary')}
          indexLabel={t('indexLabel')}
          scrollHint={t('scrollHint')}
          items={items}
          locale={locale}
        />
      </Container>
    </section>
  );
}
