import {
  addDays,
  addMonths,
  billDatesInRange,
  billsOnOrBefore,
  daysUntil,
  monthKey,
  monthLabel,
  nextBillDate,
  parseISODate,
  startOfDay,
  startOfMonth,
} from './dates';
import { costForPeriod, roundMoney } from './money';
import { isDatePaid, isManualBill, nextUnpaidDue, overdueDates } from './payments';
import type { Category, Subscription, SummaryPeriod, UpcomingEvent } from './types';

export function isOnTrial(sub: Subscription, today: Date): boolean {
  if (!sub.trialEndDate) return false;
  const end = parseISODate(sub.trialEndDate);
  if (!end) return false;
  return end.getTime() >= startOfDay(today).getTime();
}

export function isActive(sub: Subscription): boolean {
  return sub.status === 'active';
}

/** Active subscriptions that are currently being charged (not on a free trial). */
export function payingSubs(subs: readonly Subscription[], today: Date): Subscription[] {
  return subs.filter((s) => isActive(s) && !isOnTrial(s, today));
}

export interface CurrencyTotal {
  currency: string;
  amount: number;
  count: number;
}

/**
 * Totals per currency for the given period. There is no exchange-rate lookup
 * (the app is offline), so each currency is reported separately with the user's
 * primary currency first.
 */
export function totalsByCurrency(
  subs: readonly Subscription[],
  period: SummaryPeriod,
  primaryCurrency: string,
  today: Date,
): CurrencyTotal[] {
  const map = new Map<string, CurrencyTotal>();
  for (const s of payingSubs(subs, today)) {
    const entry = map.get(s.currency) ?? { currency: s.currency, amount: 0, count: 0 };
    entry.amount += costForPeriod(s.price, s.cycle, period);
    entry.count += 1;
    map.set(s.currency, entry);
  }
  const list = [...map.values()].map((t) => ({ ...t, amount: roundMoney(t.amount) }));
  list.sort((a, b) => {
    if (a.currency === primaryCurrency) return -1;
    if (b.currency === primaryCurrency) return 1;
    return b.amount - a.amount;
  });
  if (list.length === 0) list.push({ currency: primaryCurrency, amount: 0, count: 0 });
  return list;
}

export interface CategorySpend {
  category: Category;
  amount: number;
  share: number;
  count: number;
}

/** Spend per category in one currency, largest first. */
export function spendByCategory(
  subs: readonly Subscription[],
  categories: readonly Category[],
  period: SummaryPeriod,
  currency: string,
  today: Date,
): CategorySpend[] {
  const fallback = categories.find((c) => c.id === 'cat_other') ?? categories[0];
  const map = new Map<string, CategorySpend>();
  let total = 0;
  for (const s of payingSubs(subs, today)) {
    if (s.currency !== currency) continue;
    const category = categories.find((c) => c.id === s.categoryId) ?? fallback;
    if (!category) continue;
    const entry = map.get(category.id) ?? { category, amount: 0, share: 0, count: 0 };
    const cost = costForPeriod(s.price, s.cycle, period);
    entry.amount += cost;
    entry.count += 1;
    total += cost;
    map.set(category.id, entry);
  }
  const list = [...map.values()].map((e) => ({
    ...e,
    amount: roundMoney(e.amount),
    share: total > 0 ? e.amount / total : 0,
  }));
  list.sort((a, b) => b.amount - a.amount);
  return list;
}

export function mostExpensive(
  subs: readonly Subscription[],
  period: SummaryPeriod,
  currency: string,
  today: Date,
  limit = 5,
): { subscription: Subscription; amount: number }[] {
  return payingSubs(subs, today)
    .filter((s) => s.currency === currency)
    .map((s) => ({ subscription: s, amount: roundMoney(costForPeriod(s.price, s.cycle, period)) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/**
 * The next thing that will happen for an item: an overdue manual bill, a trial ending,
 * or the next charge / due date (skipping due dates already marked paid).
 */
export function nextEvent(sub: Subscription, today: Date): UpcomingEvent | null {
  if (!isActive(sub)) return null;
  const first = parseISODate(sub.firstBillDate);
  if (!first) return null;
  const overdue = overdueDates(sub, today);
  if (overdue.length > 0 && overdue[0]) {
    return { subscription: sub, type: 'overdue', date: overdue[0], daysUntil: daysUntil(overdue[0], today) };
  }
  if (isOnTrial(sub, today)) {
    const end = parseISODate(sub.trialEndDate ?? '');
    if (end) return { subscription: sub, type: 'trialEnd', date: end, daysUntil: daysUntil(end, today) };
  }
  const date = nextUnpaidDue(sub, today) ?? nextBillDate(first, sub.cycle, today);
  return { subscription: sub, type: 'bill', date, daysUntil: daysUntil(date, today) };
}

/**
 * Every overdue manual bill, renewal, due date and trial end from today through
 * today + withinDays. Overdue items come first (they are in the past), then soonest first.
 * Due dates already marked paid are left out.
 */
export function upcomingEvents(subs: readonly Subscription[], today: Date, withinDays: number): UpcomingEvent[] {
  const t = startOfDay(today);
  const end = addDays(t, withinDays);
  const events: UpcomingEvent[] = [];
  for (const sub of subs) {
    if (!isActive(sub)) continue;
    const first = parseISODate(sub.firstBillDate);
    if (!first) continue;
    for (const date of overdueDates(sub, t)) {
      events.push({ subscription: sub, type: 'overdue', date, daysUntil: daysUntil(date, t) });
    }
    if (isOnTrial(sub, t)) {
      const trialEnd = parseISODate(sub.trialEndDate ?? '');
      if (trialEnd && trialEnd.getTime() <= end.getTime()) {
        events.push({ subscription: sub, type: 'trialEnd', date: trialEnd, daysUntil: daysUntil(trialEnd, t) });
      }
    }
    for (const date of billDatesInRange(first, sub.cycle, t, end)) {
      if (isManualBill(sub) && isDatePaid(sub, date)) continue;
      events.push({ subscription: sub, type: 'bill', date, daysUntil: daysUntil(date, t) });
    }
  }
  events.sort((a, b) => a.date.getTime() - b.date.getTime() || a.subscription.name.localeCompare(b.subscription.name));
  return events;
}

/** Money still to pay across the events (charges and overdue bills; trial ends cost nothing). */
export function sumEvents(events: readonly UpcomingEvent[], currency: string): number {
  let total = 0;
  for (const e of events) {
    if (e.type !== 'trialEnd' && e.subscription.currency === currency) total += e.subscription.price;
  }
  return roundMoney(total);
}

export interface KindTotals {
  bills: number;
  subscriptions: number;
  billCount: number;
  subscriptionCount: number;
}

/** Monthly or yearly cost split into bills and subscriptions, in one currency. */
export function totalsByKind(subs: readonly Subscription[], period: SummaryPeriod, currency: string, today: Date): KindTotals {
  const out: KindTotals = { bills: 0, subscriptions: 0, billCount: 0, subscriptionCount: 0 };
  for (const s of payingSubs(subs, today)) {
    if (s.currency !== currency) continue;
    const cost = costForPeriod(s.price, s.cycle, period);
    if (s.kind === 'bill') {
      out.bills += cost;
      out.billCount += 1;
    } else {
      out.subscriptions += cost;
      out.subscriptionCount += 1;
    }
  }
  out.bills = roundMoney(out.bills);
  out.subscriptions = roundMoney(out.subscriptions);
  return out;
}

/** Total paid so far: bills on or before today (or the cancellation date), times the price. */
export function paidToDate(sub: Subscription, today: Date): number {
  const first = parseISODate(sub.firstBillDate);
  if (!first) return 0;
  let end = startOfDay(today);
  if (sub.cancelledAt) {
    const cancelled = startOfDay(new Date(sub.cancelledAt));
    if (!Number.isNaN(cancelled.getTime()) && cancelled.getTime() < end.getTime()) end = cancelled;
  }
  return roundMoney(billsOnOrBefore(first, sub.cycle, end) * sub.price);
}

export interface TimelinePoint {
  key: string;
  label: string;
  amount: number;
}

/** Projected cash out per calendar month for the next `months` months, in one currency. */
export function monthlyTimeline(
  subs: readonly Subscription[],
  today: Date,
  currency: string,
  months = 12,
  locale = 'en-US',
): TimelinePoint[] {
  const start = startOfMonth(today);
  const points: TimelinePoint[] = [];
  const index = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const m = addMonths(start, i);
    const key = monthKey(m);
    index.set(key, points.length);
    points.push({ key, label: monthLabel(m, locale), amount: 0 });
  }
  const horizonEnd = addDays(addMonths(start, months), -1);
  for (const sub of subs) {
    if (!isActive(sub) || sub.currency !== currency) continue;
    const first = parseISODate(sub.firstBillDate);
    if (!first) continue;
    for (const date of billDatesInRange(first, sub.cycle, start, horizonEnd)) {
      const i = index.get(monthKey(date));
      const point = i === undefined ? undefined : points[i];
      if (point) point.amount += sub.price;
    }
  }
  for (const p of points) p.amount = roundMoney(p.amount);
  return points;
}

export interface Counts {
  active: number;
  paused: number;
  cancelled: number;
  trials: number;
  /** Active items by kind. */
  bills: number;
  subscriptions: number;
  /** Active manual bills with at least one unpaid past due date. */
  overdue: number;
}

export function counts(subs: readonly Subscription[], today: Date): Counts {
  const out: Counts = { active: 0, paused: 0, cancelled: 0, trials: 0, bills: 0, subscriptions: 0, overdue: 0 };
  for (const s of subs) {
    if (s.status === 'active') {
      out.active += 1;
      if (s.kind === 'bill') out.bills += 1;
      else out.subscriptions += 1;
      if (isOnTrial(s, today)) out.trials += 1;
      if (overdueDates(s, today).length > 0) out.overdue += 1;
    } else if (s.status === 'paused') out.paused += 1;
    else out.cancelled += 1;
  }
  return out;
}
