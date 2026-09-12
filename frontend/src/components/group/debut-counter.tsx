// Contador de años y días desde el debut.
'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@blackpink/types';
import { Container, CountUp } from '@blackpink/ui';
import { formatDate, formatNumber } from '../../lib/format';
import { daysSince, msUntilNextUtcMidnight, yearsSince } from '../../lib/debut';

export interface DebutCounterProps {
  debutDate: string;
  initialDays: number;
  initialYears: number;
  locale: Locale;
  labels: { days: string; years: string; since: string };
}

export function DebutCounter({
  debutDate,
  initialDays,
  initialYears,
  locale,
  labels,
}: DebutCounterProps) {
  const [counts, setCounts] = useState({ days: initialDays, years: initialYears });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const refresh = () => {
      const now = Date.now();
      setCounts({ days: daysSince(debutDate, now), years: yearsSince(debutDate, now) });
      timer = setTimeout(refresh, msUntilNextUtcMidnight(Date.now()) + 1000);
    };

    refresh();
    return () => clearTimeout(timer);
  }, [debutDate]);

  const format = (value: number) => formatNumber(value, locale);

  return (
    <Container width="wide">
      <div className="border-line grid max-w-4xl border-y sm:grid-cols-2">
        <Figure
          value={counts.days}
          format={format}
          label={labels.days}
          className="text-accent-text"
          containerClassName="py-block sm:pr-10"
        />
        <Figure
          value={counts.years}
          format={format}
          label={labels.years}
          className="text-fg"
          containerClassName="border-line py-block border-t sm:border-l sm:border-t-0 sm:pl-10"
        />
      </div>

      <p className="text-fg-subtle mt-4 text-xs">
        {labels.since}{' '}
        <time dateTime={debutDate} data-numeric>
          {formatDate(debutDate, locale)}
        </time>
      </p>
    </Container>
  );
}

function Figure({
  value,
  format,
  label,
  className,
  containerClassName,
}: {
  value: number;
  format: (value: number) => string;
  label: string;
  className: string;
  containerClassName: string;
}) {
  return (
    <div className={containerClassName}>
      <p className={`font-display text-6xl font-extrabold sm:text-7xl ${className}`}>
        <CountUp value={value} format={format} />
      </p>
      <p className="text-fg-subtle text-2xs mt-3" data-uppercase>
        {label}
      </p>
    </div>
  );
}
