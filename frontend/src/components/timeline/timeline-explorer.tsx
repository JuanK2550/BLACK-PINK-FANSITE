// Cronología con filtros y tarjetas desplegables.
'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { Locale, MemberSummary, TimelineEvent } from '@blackpink/types';
import { EmptyState, FilterBar } from '@blackpink/ui';
import { useTranslations } from 'next-intl';
import { formatDate } from '../../lib/format';

export interface TimelineExplorerProps {
  events: TimelineEvent[];
  members: MemberSummary[];
  locale: Locale;
}

export function TimelineExplorer({ events, members, locale }: TimelineExplorerProps) {
  const t = useTranslations('TimelinePage');
  const cats = useTranslations('TimelineCategories');
  const disco = useTranslations('DiscographyPage');
  const empty = useTranslations('Empty');
  const reduceMotion = useReducedMotion();

  const [category, setCategory] = useState('all');
  const [member, setMember] = useState('all');
  const [open, setOpen] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(events.map((event) => event.category))], [events]);

  const visible = useMemo(
    () =>
      events.filter(
        (event) =>
          (category === 'all' || event.category === category) &&
          (member === 'all' || event.memberSlug === member),
      ),
    [category, events, member],
  );

  return (
    <>
      <div className="border-line flex flex-col gap-4 border-y py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-fg-subtle text-2xs shrink-0" data-uppercase>
            {t('filterCategory')}
          </span>
          <FilterBar
            label={t('filterCategory')}
            value={category}
            onChange={setCategory}
            options={[
              { value: 'all', label: disco('all'), count: events.length },
              ...categories.map((value) => ({
                value,
                label: cats(value),
                count: events.filter((event) => event.category === value).length,
              })),
            ]}
          />
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <span className="text-fg-subtle text-2xs shrink-0" data-uppercase>
            {t('filterMember')}
          </span>
          <FilterBar
            label={t('filterMember')}
            value={member}
            onChange={setMember}
            options={[
              { value: 'all', label: disco('all') },
              ...members.map((entry) => ({
                value: entry.slug,
                label: entry.stageName,
                count: events.filter((event) => event.memberSlug === entry.slug).length,
              })),
            ]}
          />
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-fg-subtle text-2xs mt-6" data-uppercase>
        <span data-numeric>{visible.length}</span>
      </p>

      {visible.length === 0 ? (
        <EmptyState className="mt-6" title={empty('title')} description={empty('description')} />
      ) : (
        <div className="mt-block lg:-mx-gutter lg:px-gutter lg:overflow-x-auto lg:pb-4">
          <ol className="relative flex flex-col gap-0 lg:min-w-max lg:flex-row lg:gap-8 lg:pt-10">
            <span
              aria-hidden="true"
              className="bg-line-strong absolute bottom-2 left-[5px] top-2 w-px lg:bottom-auto lg:left-0 lg:right-0 lg:top-10 lg:h-px lg:w-auto"
            />

            {visible.map((event) => {
              const expanded = open === event.id;

              return (
                <motion.li
                  key={event.id}
                  layout={!reduceMotion}
                  transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                  className="relative pb-8 pl-8 lg:w-64 lg:shrink-0 lg:pb-0 lg:pl-0"
                >
                  <span
                    aria-hidden="true"
                    className="bg-line-strong absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full lg:left-0 lg:top-10 lg:-translate-y-1/2"
                    style={expanded ? { backgroundColor: 'var(--color-accent)' } : undefined}
                  />

                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`event-${event.id}`}
                    onClick={() => setOpen(expanded ? null : event.id)}
                    className="focus-visible:outline-focus block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 lg:mt-4"
                  >
                    <time
                      data-numeric
                      dateTime={event.date}
                      className="text-accent-text font-display block text-2xl font-extrabold"
                    >
                      {formatDate(event.date, locale, event.datePrecision)}
                    </time>

                    <span className="text-fg-subtle text-2xs mt-1 block" data-uppercase>
                      {cats(event.category)}
                    </span>

                    <span className="text-fg mt-2 block text-pretty text-sm">{event.title}</span>
                  </button>

                  <AnimatePresence initial={false}>
                    {expanded && event.description ? (
                      <motion.div
                        id={`event-${event.id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, transition: { duration: 0.16 } }}
                        transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="text-fg-muted mt-3 text-pretty text-sm">
                          {event.description}
                        </p>
                        {event.source ? (
                          <p className="text-fg-subtle mt-2 text-xs [overflow-wrap:anywhere]">
                            {event.source}
                          </p>
                        ) : null}
                        {event.datePrecision !== 'day' ? (
                          <p className="text-fg-subtle text-2xs mt-2" data-uppercase>
                            {t('approximate')}
                          </p>
                        ) : null}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ol>
        </div>
      )}
    </>
  );
}
