// Inicio: curiosidades y récords.

import { getTranslations } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { EmptyState, SectionHeading, Skeleton } from '@blackpink/ui';
import { getTrivia } from '../../lib/api';
import { SectionError, SectionFrame } from '../layout/section-frame';

export async function FactsSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' });
  const empty = await getTranslations({ locale, namespace: 'Empty' });

  let facts;
  try {
    const page = await getTrivia({ locale, category: 'RECORD', limit: 4 });
    facts = page.items;
  } catch (error) {
    return (
      <SectionFrame id="curiosidades">
        <SectionError
          locale={locale}
          heading={t('facts.title')}
          detail={error instanceof Error ? error.message : undefined}
        />
      </SectionFrame>
    );
  }

  if (facts.length === 0) {
    return (
      <SectionFrame id="curiosidades">
        <SectionHeading hideRule title={t('facts.title')} />
        <EmptyState
          className="mt-block"
          title={empty('title')}
          description={empty('description')}
        />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame id="curiosidades">
      <SectionHeading
        hideRule
        title={t('facts.title')}
        description={t('facts.description')}
        actionLabel={t('facts.action')}
        actionHref={`/${locale}/curiosidades`}
      />

      <ul className="mt-block">
        {facts.map((fact) => (
          <li
            key={fact.id}
            className="border-line grid gap-2 border-b py-8 last:border-b-0 md:grid-cols-[minmax(0,1fr)_12rem] md:gap-10"
          >
            <p className="font-display text-fg text-balance text-2xl font-bold">{fact.content}</p>
            <p className="text-fg-subtle text-xs [overflow-wrap:anywhere] md:text-right">
              {fact.source}
            </p>
          </li>
        ))}
      </ul>
    </SectionFrame>
  );
}

export async function FactsSectionSkeleton({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' });

  return (
    <SectionFrame id="curiosidades">
      <SectionHeading hideRule title={t('facts.title')} description={t('facts.description')} />

      <div className="mt-block">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="border-line grid gap-2 border-b py-8 last:border-b-0 md:grid-cols-[minmax(0,1fr)_12rem] md:gap-10"
          >
            <div>
              <Skeleton className="h-7" />
              <Skeleton className="mt-2 h-7" width="76%" />
            </div>
            <Skeleton className="h-4 md:mt-1" width="60%" />
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}
