// Las filas del comparador: qué se compara, cómo se pinta cada valor y la
// frase de diferencia de edad.

'use client';

import type { ReactNode } from 'react';
import type { Locale, MemberDetail } from '@blackpink/types';
import { formatDate, formatNumber } from '../../lib/format';

export interface Row {
  key: string;
  label: string;
  values: [ReactNode | null, ReactNode | null];
  lang?: string;
}

const DAY_MS = 86_400_000;

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function cellDelay(index: number) {
  return { animationDelay: `${Math.min(index, 6) * 40}ms` };
}

function firstSoloWork(member: MemberDetail) {
  return [...member.soloWorks].sort((x, y) => x.releaseDate.localeCompare(y.releaseDate))[0];
}

export function buildRows(
  a: MemberDetail,
  b: MemberDetail,
  locale: Locale,
  labels: Record<string, string>,
): Row[] {
  const soloA = firstSoloWork(a);
  const soloB = firstSoloWork(b);

  const rows: Row[] = [
    { key: 'realName', label: labels.realName!, values: [a.fullName, b.fullName] },
    {
      key: 'koreanName',
      label: labels.koreanName!,
      values: [a.koreanName, b.koreanName],
      lang: 'ko',
    },
    {
      key: 'birthDate',
      label: labels.birthDate!,
      values: [
        a.birthDate ? <Day key="a" date={a.birthDate} locale={locale} /> : null,
        b.birthDate ? <Day key="b" date={b.birthDate} locale={locale} /> : null,
      ],
    },
    { key: 'nationality', label: labels.nationality!, values: [a.nationality, b.nationality] },
    {
      key: 'soloCount',
      label: labels.soloCount!,
      values: [
        <span key="a" data-numeric>
          {formatNumber(a.soloWorks.length, locale)}
        </span>,
        <span key="b" data-numeric>
          {formatNumber(b.soloWorks.length, locale)}
        </span>,
      ],
    },
    {
      key: 'firstSolo',
      label: labels.firstSolo!,
      values: [
        soloA ? (
          <Work key="a" title={soloA.title} date={soloA.releaseDate} locale={locale} />
        ) : null,
        soloB ? (
          <Work key="b" title={soloB.title} date={soloB.releaseDate} locale={locale} />
        ) : null,
      ],
    },
  ];

  return rows.filter((row) => row.values[0] !== null || row.values[1] !== null);
}

function Day({ date, locale }: { date: string; locale: Locale }) {
  return (
    <time dateTime={date} data-numeric>
      {formatDate(date, locale)}
    </time>
  );
}

function Work({ title, date, locale }: { title: string; date: string; locale: Locale }) {
  return (
    <>
      {title}
      <span className="text-fg-subtle">
        {' · '}
        <time dateTime={date} data-numeric>
          {formatDate(date, locale, 'year')}
        </time>
      </span>
    </>
  );
}

export function ageGapSentence(
  a: MemberDetail,
  b: MemberDetail,
  locale: Locale,
  labels: Record<string, string>,
): string | null {
  if (a.slug === b.slug || !a.birthDate || !b.birthDate) return null;

  const dateA = Date.parse(`${a.birthDate}T00:00:00.000Z`);
  const dateB = Date.parse(`${b.birthDate}T00:00:00.000Z`);
  if (Number.isNaN(dateA) || Number.isNaN(dateB)) return null;

  const days = Math.round(Math.abs(dateA - dateB) / DAY_MS);
  if (days === 0) return labels.sameDay ?? null;

  const older = dateA < dateB ? a : b;
  const younger = dateA < dateB ? b : a;

  return fill(days === 1 ? labels.ageGapOne! : labels.ageGap!, {
    older: older.stageName,
    younger: younger.stageName,
    days: formatNumber(days, locale),
  });
}
