export type PeriodKey = 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';

export interface Range {
  start: string;
  end: string;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Current period + the immediately preceding period of equal length, for comparison. */
export function resolvePeriod(key: PeriodKey, custom?: { start: Date; end: Date }): { current: Range; previous: Range } {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  let start: Date;
  let end: Date = endOfToday;

  switch (key) {
    case 'today':
      start = startOfDay(now);
      break;
    case '7d':
      start = startOfDay(new Date(now.getTime() - 6 * 86400000));
      break;
    case '30d':
      start = startOfDay(new Date(now.getTime() - 29 * 86400000));
      break;
    case '90d':
      start = startOfDay(new Date(now.getTime() - 89 * 86400000));
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      start = startOfDay(custom?.start ?? now);
      end = custom?.end ?? endOfToday;
      break;
  }

  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return {
    current: { start: start.toISOString(), end: end.toISOString() },
    previous: { start: prevStart.toISOString(), end: prevEnd.toISOString() },
  };
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
