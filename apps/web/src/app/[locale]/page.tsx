import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { LoadingRegion } from '@blackpink/ui';
import { Hero } from '../../components/hero';
import {
  LatestAlbumSection,
  LatestAlbumSectionSkeleton,
} from '../../components/home/album-section';
import { FactsSection, FactsSectionSkeleton } from '../../components/home/facts-section';
import { MembersSection, MembersSectionSkeleton } from '../../components/home/members-section';
import { TimelineSection, TimelineSectionSkeleton } from '../../components/home/timeline-section';
import { routing } from '../../i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * ============================================================================
 * HOME
 * ============================================================================
 * Cada seccion es su propio limite de Suspense, no hay uno solo alrededor de
 * todas. Asi el hero se pinta al instante, las cuatro secciones se resuelven
 * EN PARALELO, la que termina antes aparece antes, y si una falla se lleva
 * solo su hueco.
 * ============================================================================
 */
export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Loading' });

  return (
    <>
      <Hero locale={locale} />

      <Suspense
        fallback={
          <LoadingRegion label={t('members')}>
            <MembersSectionSkeleton locale={locale} />
          </LoadingRegion>
        }
      >
        <MembersSection locale={locale} />
      </Suspense>

      <Suspense
        fallback={
          <LoadingRegion label={t('albums')}>
            <LatestAlbumSectionSkeleton locale={locale} />
          </LoadingRegion>
        }
      >
        <LatestAlbumSection locale={locale} />
      </Suspense>

      <Suspense
        fallback={
          <LoadingRegion label={t('timeline')}>
            <TimelineSectionSkeleton locale={locale} />
          </LoadingRegion>
        }
      >
        <TimelineSection locale={locale} />
      </Suspense>

      <Suspense
        fallback={
          <LoadingRegion label={t('trivia')}>
            <FactsSectionSkeleton locale={locale} />
          </LoadingRegion>
        }
      >
        <FactsSection locale={locale} />
      </Suspense>
    </>
  );
}
