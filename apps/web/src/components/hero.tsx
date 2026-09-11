import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { Locale } from '@blackpink/types';
import { Container } from '@blackpink/ui';
import { HERO_IMAGE } from '../data/media';
import { HeroReveal } from './hero-reveal';

/**
 * ============================================================================
 * PORTADA DEL SITIO
 * ============================================================================
 * El primer viewport es una PORTADA DE REVISTA, no un encabezado con un botón:
 * el wordmark ocupa el ancho completo y sangra hasta el canal, y debajo va el
 * índice del sitio como si fuera el sumario de un número.
 *
 * Es un Server Component: el texto ya viene traducido en el HTML. Solo la
 * animación de entrada vive en cliente, así que el contenido se lee aunque el
 * JavaScript no llegue nunca.
 * ============================================================================
 */
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
      {/* Capa de imagen: vacía hasta que el propietario deje un archivo en
          public/hero y active HERO_IMAGE en data/media.ts. */}
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
          {/* Degradado de legibilidad, no decorativo: garantiza el contraste
              del titular contra cualquier foto. */}
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
