import type { BillingCycle, CycleUnit } from './types';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Formats a Date as a local calendar date, yyyy-mm-dd. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parses yyyy-mm-dd into a Date at local midnight. Returns null for anything invalid, including Feb 30. */
export function parseISODate(s: string): Date | null {
  const m = ISO_DATE.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export function isValidISODate(s: string): boolean {
  return parseISODate(s) !== null;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Adds calendar months, clamping the day so Jan 31 + 1 month is Feb 28 (or 29). */
export function addMonths(d: Date, n: number): Date {
  const totalMonths = d.getMonth() + n;
  const year = d.getFullYear() + Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  const day = Math.min(d.getDate(), daysInMonth(year, month));
  return new Date(year, month, day);
}

export function addYears(d: Date, n: number): Date {
  return addMonths(d, 12 * n);
}

/** Whole calendar days from a to b (negative when b is before a). Ignores time of day and DST. */
export function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

const APPROX_DAYS: Record<CycleUnit, number> = {
  day: 1,
  week: 7,
  month: 365.25 / 12,
  year: 365.25,
};

/**
 * The n-th bill date (0 = the first bill) for an anchor date and cycle.
 * Always computed from the anchor, never chained, so a sub billed on the 31st
 * stays on the 31st in months that have one.
 */
export function nthBillDate(first: Date, cycle: BillingCycle, n: number): Date {
  const steps = n * cycle.every;
  switch (cycle.unit) {
    case 'day':
      return addDays(first, steps);
    case 'week':
      return addDays(first, steps * 7);
    case 'month':
      return addMonths(first, steps);
    case 'year':
      return addMonths(first, steps * 12);
  }
}

/** Index of the first bill on or after `today`. A bill due today counts as upcoming. */
export function nextBillIndex(first: Date, cycle: BillingCycle, today: Date): number {
  const t = startOfDay(today).getTime();
  const f = startOfDay(first);
  if (f.getTime() >= t) return 0;
  const approx = daysBetween(f, startOfDay(today)) / (APPROX_DAYS[cycle.unit] * cycle.every);
  let n = Math.max(0, Math.floor(approx) - 1);
  while (nthBillDate(f, cycle, n).getTime() < t) n++;
  while (n > 0 && nthBillDate(f, cycle, n - 1).getTime() >= t) n--;
  return n;
}

export function nextBillDate(first: Date, cycle: BillingCycle, today: Date): Date {
  const f = startOfDay(first);
  return nthBillDate(f, cycle, nextBillIndex(f, cycle, today));
}

export function upcomingBillDates(first: Date, cycle: BillingCycle, today: Date, count: number): Date[] {
  const f = startOfDay(first);
  const start = nextBillIndex(f, cycle, today);
  const out: Date[] = [];
  for (let i = 0; i < count; i++) out.push(nthBillDate(f, cycle, start + i));
  return out;
}

/** Bill dates on or after `today` and on or before `end`. Capped to avoid runaway loops on tiny cycles. */
export function billDatesInRange(first: Date, cycle: BillingCycle, today: Date, end: Date, cap = 400): Date[] {
  const f = startOfDay(first);
  const e = startOfDay(end).getTime();
  let n = nextBillIndex(f, cycle, today);
  const out: Date[] = [];
  while (out.length < cap) {
    const d = nthBillDate(f, cycle, n);
    if (d.getTime() > e) break;
    out.push(d);
    n++;
  }
  return out;
}

/** Number of bill dates on or before `date` (0 if the first bill is still in the future). */
export function billsOnOrBefore(first: Date, cycle: BillingCycle, date: Date): number {
  const f = startOfDay(first);
  const d = startOfDay(date);
  if (f.getTime() > d.getTime()) return 0;
  return nextBillIndex(f, cycle, addDays(d, 1));
}

export function daysUntil(date: Date, today: Date): number {
  return daysBetween(startOfDay(today), startOfDay(date));
}

export function relativeDayLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1) return `In ${days} days`;
  return `${-days} days ago`;
}

export function formatDate(d: Date, locale = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, options ?? { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  } catch {
    return toISODate(d);
  }
}

export function formatShortDate(d: Date, locale = 'en-US'): string {
  return formatDate(d, locale, { month: 'short', day: 'numeric' });
}

export function formatWeekday(d: Date, locale = 'en-US'): string {
  return formatDate(d, locale, { weekday: 'short' });
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function monthLabel(d: Date, locale = 'en-US'): string {
  return formatDate(d, locale, { month: 'short' });
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function formatTimeOfDay(hour: number, locale = 'en-US'): string {
  const d = new Date(2000, 0, 1, hour, 0, 0);
  return formatDate(d, locale, { hour: 'numeric', minute: '2-digit' });
}
