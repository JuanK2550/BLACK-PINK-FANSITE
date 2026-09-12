// Discografía con filtros por formato y año, orden y vista.
'use client';

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { AlbumSummary } from '@blackpink/types';
import { EmptyState, FilterBar } from '@blackpink/ui';
import { AlbumCover } from './album-cover';
import { useTranslations } from 'next-intl';
import type { Locale } from '@blackpink/types';
import { formatYear } from '../../lib/format';

type SortKey = 'newest' | 'oldest' | 'title';
type ViewKey = 'grid' | 'list';

export interface DiscographyBrowserProps {
  albums: AlbumSummary[];
  locale: Locale;
}

export function DiscographyBrowser({ albums, locale }: DiscographyBrowserProps) {
  const copy = useTranslations('DiscographyPage');
  const albumTypes = useTranslations('AlbumTypes');
  const empty = useTranslations('Empty');
  const a11y = useTranslations('A11y');
  const reduceMotion = useReducedMotion();

  const [type, setType] = useState('all');
  const [year, setYear] = useState('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [view, setView] = useState<ViewKey>('grid');

  const years = useMemo(
    () => [...new Set(albums.map((album) => album.year))].sort((a, b) => b - a),
    [albums],
  );

  const types = useMemo(() => [...new Set(albums.map((album) => album.type))], [albums]);

  const visible = useMemo(() => {
    const filtered = albums.filter(
      (album) =>
        (type === 'all' || album.type === type) && (year === 'all' || String(album.year) === year),
    );

    return filtered.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, locale);
      const diff = a.releaseDate.localeCompare(b.releaseDate);
      return sort === 'newest' ? -diff : diff;
    });
  }, [albums, locale, sort, type, year]);

  const layoutTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.23, 1, 0.32, 1] as const };

  return (
    <>
      <div className="border-line flex flex-col gap-4 border-y py-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <ControlGroup label={copy('filterType')}>
            <FilterBar
              label={copy('filterType')}
              value={type}
              onChange={setType}
              options={[
                { value: 'all', label: copy('all'), count: albums.length },
                ...types.map((value) => ({
                  value,
                  label: albumTypes(value),
                  count: albums.filter((album) => album.type === value).length,
                })),
              ]}
            />
          </ControlGroup>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <ControlGroup label={copy('filterYear')}>
            <FilterBar
              label={copy('filterYear')}
              value={year}
              onChange={setYear}
              options={[
                { value: 'all', label: copy('all') },
                ...years.map((value) => ({ value: String(value), label: String(value) })),
              ]}
            />
          </ControlGroup>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
          <ControlGroup label={copy('sortLabel')}>
            <FilterBar
              label={copy('sortLabel')}
              value={sort}
              onChange={(value) => setSort(value as SortKey)}
              options={[
                { value: 'newest', label: copy('sortNewest') },
                { value: 'oldest', label: copy('sortOldest') },
                { value: 'title', label: copy('sortTitle') },
              ]}
            />
          </ControlGroup>

          <ControlGroup label={copy('viewLabel')}>
            <FilterBar
              label={copy('viewLabel')}
              value={view}
              onChange={(value) => setView(value as ViewKey)}
              options={[
                { value: 'grid', label: copy('viewGrid') },
                { value: 'list', label: copy('viewList') },
              ]}
            />
          </ControlGroup>
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-fg-subtle text-2xs mt-6" data-uppercase>
        <span data-numeric>{visible.length}</span> {copy('results')}
      </p>

      {visible.length === 0 ? (
        <EmptyState className="mt-6" title={empty('title')} description={empty('description')} />
      ) : (
        <LayoutGroup>
          <motion.ul
            layout={!reduceMotion}
            transition={layoutTransition}
            className={
              view === 'grid'
                ? 'mt-block grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4'
                : 'mt-block flex flex-col'
            }
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((album) => (
                <motion.li
                  key={album.slug}
                  layout={!reduceMotion}
                  transition={layoutTransition}
                  initial={{ opacity: 0, transform: 'scale(0.96)' }}
                  animate={{ opacity: 1, transform: 'scale(1)' }}
                  exit={{ opacity: 0, transform: 'scale(0.96)', transition: { duration: 0.16 } }}
                  className={view === 'list' ? 'border-line border-b last:border-b-0' : undefined}
                >
                  {view === 'grid' ? (
                    <GridCard
                      album={album}
                      locale={locale}
                      formatLabel={albumTypes(album.type)}
                      alt={a11y('coverAlt', { title: album.title })}
                    />
                  ) : (
                    <ListRow
                      album={album}
                      locale={locale}
                      formatLabel={albumTypes(album.type)}
                      alt={a11y('coverAlt', { title: album.title })}
                    />
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </LayoutGroup>
      )}
    </>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="text-fg-subtle text-2xs shrink-0" data-uppercase>
        {label}
      </span>
      {children}
    </div>
  );
}

function GridCard({
  album,
  formatLabel,
  alt,
  locale,
}: {
  album: AlbumSummary;
  formatLabel: string;
  alt: string;
  locale: Locale;
}) {
  return (
    <a
      href={`/${locale}/discografia/${album.slug}`}
      className="group/card focus-visible:outline-focus block focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <AlbumCover
        cover={album}
        title={album.title}
        alt={alt}
        glyph={String(album.year)}
        zoom
        sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 23vw"
      />
      <p className="font-display text-fg group-hover/card:text-accent-text ease-out-soft mt-3 text-lg font-bold transition-colors duration-[var(--dur-2)]">
        {album.title}
      </p>
      <p className="text-fg-subtle mt-0.5 text-xs">
        {formatLabel} ·{' '}
        <time dateTime={album.releaseDate}>{formatYear(album.releaseDate, locale)}</time>
      </p>
    </a>
  );
}

function ListRow({
  album,
  formatLabel,
  alt,
  locale,
}: {
  album: AlbumSummary;
  formatLabel: string;
  alt: string;
  locale: Locale;
}) {
  return (
    <a
      href={`/${locale}/discografia/${album.slug}`}
      className="group/row hover:bg-accent-tint focus-visible:outline-focus ease-out-soft -mx-3 flex items-center gap-5 px-3 py-4 transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-1"
    >
      <AlbumCover
        cover={album}
        title={album.title}
        alt={alt}
        variant="thumb"
        glyph={String(album.year).slice(2)}
        sizes="56px"
        className="w-14 shrink-0"
      />

      <span className="min-w-0 flex-1">
        <span className="font-display text-fg group-hover/row:text-accent-text ease-out-soft block truncate text-lg font-bold transition-colors duration-[var(--dur-2)]">
          {album.title}
        </span>
        <span className="text-fg-subtle block text-xs">{formatLabel}</span>
      </span>

      <span data-numeric className="text-fg-muted shrink-0 text-sm">
        {album.trackCount}
      </span>
      <time
        data-numeric
        className="text-fg-muted w-12 shrink-0 text-right text-sm"
        dateTime={album.releaseDate}
      >
        {album.year}
      </time>
    </a>
  );
}
