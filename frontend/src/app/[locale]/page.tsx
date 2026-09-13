// Página de inicio.

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { LoadingRegion } from '@blackpink/ui';
import { Hero } from '../../components/home/hero';
import {
  LatestAlbumSection,
  LatestAlbumSectionSkeleton,
} from '../../components/home/album-section';
import { FactsSection, FactsSectionSkeleton } from '../../components/home/facts-section';
import { MembersSection, MembersSectionSkeleton } from '../../components/home/members-section';
import { TimelineSection, TimelineSectionSkeleton } from '../../components/home/timeline-section';
import { JsonLd } from '../../components/layout/json-ld';
import { routing } from '../../i18n/routing';
import { buildMetadata, websiteJsonLd } from '../../lib/seo';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Home' });
  const title = t('metaTitle');
  const base = buildMetadata({ title, description: t('metaDescription'), path: '', locale });

  return {
    ...base,
    title: { absolute: title },
    openGraph: { ...base.openGraph, title },
    twitter: { ...base.twitter, title },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Loading' });
  const home = await getTranslations({ locale, namespace: 'Home' });

  return (
    <>
      <JsonLd data={websiteJsonLd(locale, home('metaDescription'))} />
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
