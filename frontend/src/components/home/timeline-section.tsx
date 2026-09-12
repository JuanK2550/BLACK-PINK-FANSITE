// Inicio: cronología en carrusel horizontal.

import { getTranslations } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { EmptyState, SectionHeading, Skeleton } from '@blackpink/ui';
import { getTimeline } from '../../lib/api';
import { formatYear } from '../../lib/format';
import { SectionError, SectionFrame } from '../layout/section-frame';

export async function TimelineSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' });
  const empty = await getTranslations({ locale, namespace: 'Empty' });

  let events;
  try {
    const page = await getTimeline({ locale, limit: 8 });
    events = page.items;
  } catch (error) {
    return (
      <SectionFrame id="cronologia">
        <SectionError
          locale={locale}
          heading={t('timeline.title')}
          detail={error instanceof Error ? error.message : undefined}
        />
      </SectionFrame>
    );
  }

  if (events.length === 0) {
    return (
      <SectionFrame id="cronologia">
        <SectionHeading hideRule title={t('timeline.title')} />
        <EmptyState
          className="mt-block"
          title={empty('title')}
          description={empty('description')}
        />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame id="cronologia">
      <SectionHeading
        hideRule
        title={t('timeline.title')}
        description={t('timeline.description')}
        actionLabel={t('timeline.action')}
        actionHref={`/${locale}/cronologia`}
      />

      <div
        tabIndex={0}
        role="region"
        aria-label={t('timeline.title')}
        className="mt-block -mx-gutter px-gutter focus-visible:outline-focus overflow-x-auto pb-2 focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <ol className="relative flex min-w-max gap-10 pt-8">
          <span aria-hidden="true" className="bg-line-strong absolute inset-x-0 top-8 h-px" />

          {events.map((event) => (
            <li key={event.id} className="group relative w-56 shrink-0">
              <span
                aria-hidden="true"
                className="bg-line-strong group-hover:bg-accent ease-out-soft absolute left-0 top-8 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-colors duration-[var(--dur-2)]"
              />
              <time
                className="font-display text-accent-text mt-6 block text-3xl font-extrabold"
                dateTime={event.date}
              >
                {formatYear(event.date, locale)}
              </time>
              <p className="text-fg mt-2 text-pretty text-sm">{event.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </SectionFrame>
  );
}

export async function TimelineSectionSkeleton({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' });

  return (
    <SectionFrame id="cronologia">
      <SectionHeading
        hideRule
        title={t('timeline.title')}
        description={t('timeline.description')}
      />

      <div className="mt-block -mx-gutter px-gutter overflow-x-auto pb-2">
        <div className="relative flex min-w-max gap-10 pt-8">
          <span aria-hidden="true" className="bg-line-strong absolute inset-x-0 top-8 h-px" />
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="w-56 shrink-0">
              <Skeleton className="mt-6 h-9" width="55%" />
              <Skeleton className="mt-2 h-4" />
              <Skeleton className="mt-1.5 h-4" width="72%" />
            </div>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}
