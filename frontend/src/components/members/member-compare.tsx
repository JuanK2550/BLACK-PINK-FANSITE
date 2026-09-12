// Comparador de dos integrantes lado a lado.
'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Locale, MemberDetail } from '@blackpink/types';
import { FilterBar, SwapIcon, VisuallyHidden } from '@blackpink/ui';
import { MemberPhoto } from './member-photo';
import { ageGapSentence, buildRows, cellDelay } from './member-compare-rows';

export interface MemberCompareProps {
  members: MemberDetail[];
  locale: Locale;
  initialA: string;
  initialB: string;
  labels: Record<string, string>;
  creditsHref: string;
}

export function MemberCompare({
  members,
  locale,
  initialA,
  initialB,
  labels,
  creditsHref,
}: MemberCompareProps) {
  const [slugs, setSlugs] = useState<[string, string]>([initialA, initialB]);

  const a = members.find((member) => member.slug === slugs[0]) ?? members[0]!;
  const b = members.find((member) => member.slug === slugs[1]) ?? members[1]!;

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('a', a.slug);
    url.searchParams.set('b', b.slug);
    window.history.replaceState(null, '', url);
  }, [a.slug, b.slug]);

  function choose(side: 0 | 1, slug: string) {
    setSlugs((current) => {
      const other = side === 0 ? 1 : 0;
      if (current[other] === slug) return [current[1], current[0]];
      const next: [string, string] = [current[0], current[1]];
      next[side] = slug;
      return next;
    });
  }

  function swap() {
    setSlugs((current) => [current[1], current[0]]);
  }

  const options = useMemo(
    () => members.map((member) => ({ value: member.slug, label: member.stageName })),
    [members],
  );

  const rows = useMemo(() => buildRows(a, b, locale, labels), [a, b, locale, labels]);
  const gap = ageGapSentence(a, b, locale, labels);

  return (
    <div>
      <div className="border-line grid gap-x-4 gap-y-6 border-b pb-6 sm:grid-cols-2 sm:gap-x-10">
        <div>
          <p className="text-fg-subtle text-2xs mb-2" data-uppercase>
            {labels.slotA}
          </p>
          <FilterBar
            bleed={false}
            label={labels.slotA!}
            options={options}
            value={a.slug}
            onChange={(value) => choose(0, value)}
          />
        </div>

        <div className="relative">
          <p className="text-fg-subtle text-2xs mb-2" data-uppercase>
            {labels.slotB}
          </p>
          <FilterBar
            bleed={false}
            label={labels.slotB!}
            options={options}
            value={b.slug}
            onChange={(value) => choose(1, value)}
          />

          <button
            type="button"
            onClick={swap}
            title={labels.swap}
            className="text-fg-subtle hover:text-accent-text focus-visible:outline-focus ease-out-soft absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full text-lg transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.92] active:duration-[var(--dur-1)]"
          >
            <SwapIcon />
            <VisuallyHidden>{labels.swap}</VisuallyHidden>
          </button>
        </div>
      </div>

      <div className="mt-block grid grid-cols-2 gap-x-4 sm:gap-x-10">
        {[a, b].map((member) => (
          <div key={member.slug} className="bp-compare-in" style={cellDelay(0)}>
            <div className="w-28">
              <MemberPhoto member={member} sizes="112px" hideCredit />
            </div>
            <p className="font-display text-fg mt-4 text-xl font-bold sm:text-2xl">
              {member.stageName}
            </p>
            <p
              className="bp-member-ink mt-1 text-sm"
              style={{ '--bp-member': member.colorAccent ?? undefined } as CSSProperties}
            >
              {member.position}
            </p>
          </div>
        ))}
      </div>

      <dl className="mt-block">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="border-line grid grid-cols-2 gap-x-4 border-t pb-4 pt-4 first:border-t-0 sm:gap-x-10"
          >
            <dt className="text-fg-subtle text-2xs col-span-2 mb-1" data-uppercase>
              {row.label}
            </dt>

            {row.values.map((value, side) => {
              const member = side === 0 ? a : b;
              return (
                <dd
                  key={member.slug}
                  lang={row.lang}
                  style={cellDelay(index + 1)}
                  className={[
                    'bp-compare-in text-pretty text-sm sm:text-base',
                    side === 1 ? 'border-line border-l pl-4 sm:pl-10' : '',
                    value === null ? 'text-fg-subtle' : 'text-fg',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <VisuallyHidden>{member.stageName}: </VisuallyHidden>
                  {value ?? '—'}
                </dd>
              );
            })}
          </div>
        ))}
      </dl>

      {gap ? (
        <p
          key={`${a.slug}-${b.slug}`}
          className="bp-compare-in border-line text-fg-muted mt-2 text-pretty border-t pt-6 text-sm"
        >
          {gap}
        </p>
      ) : null}

      <p className="text-fg-subtle mt-6 text-xs">
        <a
          href={creditsHref}
          className="hover:text-accent-text focus-visible:outline-focus ease-out-soft underline underline-offset-4 transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {labels.photoCredits}
        </a>
      </p>
    </div>
  );
}
