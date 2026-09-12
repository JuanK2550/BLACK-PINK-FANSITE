// Tablero de curiosidades con tarjetas que se giran.
'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { Trivia } from '@blackpink/types';
import { EmptyState, FilterBar, buttonStyles } from '@blackpink/ui';
import { useTranslations } from 'next-intl';

export interface TriviaBoardProps {
  facts: Trivia[];
}

export function TriviaBoard({ facts }: TriviaBoardProps) {
  const t = useTranslations('TriviaPage');
  const cats = useTranslations('TriviaCategories');
  const timeline = useTranslations('TimelinePage');
  const disco = useTranslations('DiscographyPage');
  const empty = useTranslations('Empty');
  const reduceMotion = useReducedMotion();

  const [category, setCategory] = useState('all');
  const [picked, setPicked] = useState<Trivia | null>(null);
  const [shuffling, setShuffling] = useState(false);

  const categories = useMemo(() => [...new Set(facts.map((fact) => fact.category))], [facts]);

  const visible = useMemo(
    () => facts.filter((fact) => category === 'all' || fact.category === category),
    [category, facts],
  );

  function pickRandom() {
    if (visible.length === 0) return;

    const choose = () => {
      const next = visible[Math.floor(Math.random() * visible.length)] ?? null;
      setPicked(next);
    };

    if (reduceMotion) {
      choose();
      return;
    }

    setShuffling(true);
    let ticks = 0;
    const interval = setInterval(() => {
      choose();
      ticks += 1;
      if (ticks >= 8) {
        clearInterval(interval);
        setShuffling(false);
      }
    }, 80);
  }

  return (
    <>
      <div className="border-line flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-y py-4">
        <div className="flex min-w-0 items-center gap-3">
          <FilterBar
            label={timeline('filterCategory')}
            value={category}
            onChange={(value) => {
              setCategory(value);
              setPicked(null);
            }}
            options={[
              { value: 'all', label: disco('all'), count: facts.length },
              ...categories.map((value) => ({
                value,
                label: cats(value),
                count: facts.filter((fact) => fact.category === value).length,
              })),
            ]}
          />
        </div>

        <button
          type="button"
          onClick={pickRandom}
          disabled={visible.length === 0 || shuffling}
          className={buttonStyles({ size: 'sm' })}
        >
          {shuffling ? t('shuffling') : t('random')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {picked ? (
          <motion.div
            key={picked.id}
            initial={{ opacity: 0, transform: 'scale(0.97)' }}
            animate={{ opacity: 1, transform: 'scale(1)' }}
            exit={{ opacity: 0, transform: 'scale(0.97)', transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="border-line mt-8 border-t pt-8"
            aria-live="polite"
          >
            <p className="font-display text-fg text-balance text-3xl font-extrabold">
              {picked.content}
            </p>
            <p className="text-fg-subtle mt-3 text-xs">{picked.source}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {visible.length === 0 ? (
        <EmptyState className="mt-8" title={empty('title')} description={empty('description')} />
      ) : (
        <ul className="mt-block gap-6 sm:columns-2 lg:columns-3">
          {visible.map((fact) => (
            <li key={fact.id} className="bg-surface shadow-hairline mb-6 break-inside-avoid p-5">
              <p className="text-fg text-pretty text-base">{fact.content}</p>

              <p className="border-line text-fg-subtle mt-4 border-t pt-3 text-xs">{fact.source}</p>

              <p className="text-fg-subtle text-2xs mt-2" data-uppercase>
                {cats(fact.category)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
