import { BUILT_IN_CATEGORIES } from '@/lib/categories';
import { toISODate } from '@/lib/dates';
import {
  counts,
  isOnTrial,
  monthlyTimeline,
  mostExpensive,
  nextEvent,
  paidToDate,
  spendByCategory,
  sumEvents,
  totalsByCurrency,
  upcomingEvents,
} from '@/lib/stats';

import { makeSub, TODAY } from '../helpers';

describe('totalsByCurrency', () => {
  test('sums active paying subscriptions per currency, primary first', () => {
    const subs = [
      makeSub({ price: 10, cycle: { every: 1, unit: 'month' } }),
      makeSub({ price: 120, cycle: { every: 1, unit: 'year' } }),
      makeSub({ price: 5, currency: 'EUR' }),
      makeSub({ price: 99, status: 'paused' }),
      makeSub({ price: 50, status: 'cancelled' }),
      makeSub({ price: 20, trialEndDate: '2026-11-01', firstBillDate: '2026-11-02' }),
    ];
    const monthly = totalsByCurrency(subs, 'month', 'USD', TODAY);
    expect(monthly).toEqual([
      { currency: 'USD', amount: 20, count: 2 },
      { currency: 'EUR', amount: 5, count: 1 },
    ]);
    const yearly = totalsByCurrency(subs, 'year', 'EUR', TODAY);
    expect(yearly[0]).toEqual({ currency: 'EUR', amount: 60, count: 1 });
    expect(yearly[1]).toEqual({ currency: 'USD', amount: 240, count: 2 });
  });

  test('returns a zero row for the primary currency when empty', () => {
    expect(totalsByCurrency([], 'month', 'GBP', TODAY)).toEqual([{ currency: 'GBP', amount: 0, count: 0 }]);
  });
});

describe('trials', () => {
  test('isOnTrial is true through the end date', () => {
    const sub = makeSub({ trialEndDate: '2026-10-22' });
    expect(isOnTrial(sub, TODAY)).toBe(true);
    expect(isOnTrial(sub, new Date(2026, 9, 23))).toBe(false);
    expect(isOnTrial(makeSub(), TODAY)).toBe(false);
  });

  test('nextEvent reports the trial end before the first bill', () => {
    const sub = makeSub({ trialEndDate: '2026-10-30', firstBillDate: '2026-10-31' });
    const e = nextEvent(sub, TODAY);
    expect(e?.type).toBe('trialEnd');
    expect(e && toISODate(e.date)).toBe('2026-10-30');
    expect(e?.daysUntil).toBe(8);
    const paid = nextEvent(makeSub({ firstBillDate: '2026-01-15' }), TODAY);
    expect(paid?.type).toBe('bill');
    expect(paid && toISODate(paid.date)).toBe('2026-11-15');
    expect(nextEvent(makeSub({ status: 'paused' }), TODAY)).toBeNull();
  });
});

describe('spendByCategory and mostExpensive', () => {
  test('groups by category with shares that sum to one', () => {
    const subs = [
      makeSub({ price: 30, categoryId: 'cat_streaming' }),
      makeSub({ price: 10, categoryId: 'cat_music' }),
      makeSub({ price: 10, categoryId: 'cat_streaming' }),
      makeSub({ price: 100, categoryId: 'cat_music', currency: 'EUR' }),
      makeSub({ price: 7, categoryId: 'does-not-exist' }),
    ];
    const result = spendByCategory(subs, BUILT_IN_CATEGORIES, 'month', 'USD', TODAY);
    expect(result.map((r) => [r.category.id, r.amount, r.count])).toEqual([
      ['cat_streaming', 40, 2],
      ['cat_music', 10, 1],
      ['cat_other', 7, 1],
    ]);
    expect(result.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1);
  });

  test('mostExpensive ranks by normalised monthly cost', () => {
    const subs = [
      makeSub({ name: 'Cheap', price: 5 }),
      makeSub({ name: 'Yearly', price: 240, cycle: { every: 1, unit: 'year' } }),
      makeSub({ name: 'Weekly', price: 10, cycle: { every: 1, unit: 'week' } }),
    ];
    const top = mostExpensive(subs, 'month', 'USD', TODAY, 2);
    expect(top.map((t) => t.subscription.name)).toEqual(['Weekly', 'Yearly']);
    expect(top[1]?.amount).toBe(20);
  });
});

describe('upcomingEvents', () => {
  test('collects bills and trial ends inside the window, sorted', () => {
    const subs = [
      makeSub({ name: 'Monthly', firstBillDate: '2026-01-25' }),
      makeSub({ name: 'Weekly', cycle: { every: 1, unit: 'week' }, firstBillDate: '2026-10-22' }),
      makeSub({ name: 'Trial', trialEndDate: '2026-10-24', firstBillDate: '2026-10-25', price: 3 }),
      makeSub({ name: 'Paused', status: 'paused' }),
      makeSub({ name: 'Far', firstBillDate: '2027-06-01' }),
    ];
    const events = upcomingEvents(subs, TODAY, 7);
    expect(events.map((e) => `${e.subscription.name}:${e.type}:${toISODate(e.date)}`)).toEqual([
      'Weekly:bill:2026-10-22',
      'Trial:trialEnd:2026-10-24',
      'Monthly:bill:2026-10-25',
      'Trial:bill:2026-10-25',
      'Weekly:bill:2026-10-29',
    ]);
    expect(sumEvents(events, 'USD')).toBe(33);
  });
});

describe('paidToDate', () => {
  test('counts bills up to today', () => {
    expect(paidToDate(makeSub({ price: 10, firstBillDate: '2026-01-15' }), TODAY)).toBe(100);
    expect(paidToDate(makeSub({ price: 10, firstBillDate: '2026-11-15' }), TODAY)).toBe(0);
  });

  test('stops at the cancellation date', () => {
    const sub = makeSub({ price: 10, firstBillDate: '2026-01-15', status: 'cancelled', cancelledAt: '2026-03-20T10:00:00.000Z' });
    expect(paidToDate(sub, TODAY)).toBe(30);
  });
});

describe('monthlyTimeline', () => {
  test('buckets real bill dates by month for one currency', () => {
    const subs = [
      makeSub({ price: 10, firstBillDate: '2026-01-15' }),
      makeSub({ price: 120, cycle: { every: 1, unit: 'year' }, firstBillDate: '2025-12-01' }),
      makeSub({ price: 999, currency: 'EUR' }),
      makeSub({ price: 50, status: 'paused' }),
    ];
    const points = monthlyTimeline(subs, TODAY, 'USD', 12);
    expect(points).toHaveLength(12);
    expect(points[0]?.key).toBe('2026-10');
    expect(points[0]?.amount).toBe(10);
    expect(points[2]?.key).toBe('2026-12');
    expect(points[2]?.amount).toBe(130);
    expect(points[11]?.key).toBe('2027-09');
    expect(points.reduce((s, p) => s + p.amount, 0)).toBe(240);
  });
});

describe('counts', () => {
  test('tallies statuses and trials', () => {
    const subs = [makeSub(), makeSub({ trialEndDate: '2026-12-01', firstBillDate: '2026-12-02' }), makeSub({ status: 'paused' }), makeSub({ status: 'cancelled' })];
    expect(counts(subs, TODAY)).toEqual({ active: 2, paused: 1, cancelled: 1, trials: 1 });
  });
});
