// Cálculo de años y días desde el debut.

function utcMidnight(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00.000Z`);
}

const DAY_MS = 86_400_000;

export function daysSince(isoDate: string, now: number): number {
  const start = utcMidnight(isoDate);
  if (Number.isNaN(start)) return 0;

  const today = Math.floor(now / DAY_MS) * DAY_MS;
  return Math.max(0, Math.round((today - start) / DAY_MS));
}

export function yearsSince(isoDate: string, now: number): number {
  const start = new Date(utcMidnight(isoDate));
  if (Number.isNaN(start.getTime())) return 0;

  const today = new Date(now);

  let years = today.getUTCFullYear() - start.getUTCFullYear();

  const beforeAnniversary =
    today.getUTCMonth() < start.getUTCMonth() ||
    (today.getUTCMonth() === start.getUTCMonth() && today.getUTCDate() < start.getUTCDate());

  if (beforeAnniversary) years -= 1;

  return Math.max(0, years);
}

export function msUntilNextUtcMidnight(now: number): number {
  return DAY_MS - (now % DAY_MS);
}
