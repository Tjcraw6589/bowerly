import { amountText, eventLabel } from '@/lib/labels';
import {
  daysLate,
  isDatePaid,
  isManualBill,
  MAX_OVERDUE,
  nextUnpaidDue,
  overdueDates,
  paidThroughAfterMarking,
  paidThroughAfterUndo,
} from '@/lib/payments';
import { counts, nextEvent, sumEvents, totalsByKind, upcomingEvents } from '@/lib/stats';
import { filterSubscriptions } from '@/lib/sort';
import { toISODate } from '@/lib/dates';

import { makeSub, TODAY } from '../helpers';

/** Rent due on the 1st, paid by hand, tracked since 1 Sep 2026. Today is 22 Oct 2026. */
function rent(overrides = {}) {
  return makeSub({
    name: 'Rent',
    kind: 'bill',
    autopay: false,
    price: 1200,
    firstBillDate: '2026-01-01',
    createdAt: '2026-09-01T12:00:00.000Z',
    categoryId: 'cat_housing',
    ...overrides,
  });
}

const iso = (d: Date | null) => (d ? toISODate(d) : null);

describe('manual bills', () => {
  test('only bills without autopay count as paid by hand', () => {
    expect(isManualBill(rent())).toBe(true);
    expect(isManualBill(rent({ autopay: true }))).toBe(false);
    expect(isManualBill(makeSub())).toBe(false);
  });

  test('due dates since tracking started and not marked paid are overdue, oldest first', () => {
    expect(overdueDates(rent(), TODAY).map(iso)).toEqual(['2026-09-01', '2026-10-01']);
    expect(overdueDates(rent({ paidThrough: '2026-09-01' }), TODAY).map(iso)).toEqual(['2026-10-01']);
    expect(overdueDates(rent({ paidThrough: '2026-10-01' }), TODAY)).toEqual([]);
  });

  test('a bill due today is not overdue yet, and dates before tracking started are ignored', () => {
    const dueToday = rent({ firstBillDate: '2026-01-22', createdAt: '2026-10-22T08:00:00.000Z' });
    expect(overdueDates(dueToday, TODAY)).toEqual([]);
    expect(iso(nextUnpaidDue(dueToday, TODAY))).toBe('2026-10-22');
  });

  test('autopaid bills, subscriptions, paused and cancelled items are never overdue', () => {
    expect(overdueDates(rent({ autopay: true }), TODAY)).toEqual([]);
    expect(overdueDates(rent({ kind: 'subscription', autopay: true }), TODAY)).toEqual([]);
    expect(overdueDates(rent({ status: 'paused' }), TODAY)).toEqual([]);
    expect(overdueDates(rent({ status: 'cancelled' }), TODAY)).toEqual([]);
  });

  test('the overdue list is capped for long-untouched weekly bills', () => {
    const weekly = rent({ cycle: { every: 1, unit: 'week' }, createdAt: '2020-01-01T00:00:00.000Z', firstBillDate: '2020-01-01' });
    const list = overdueDates(weekly, TODAY);
    expect(list).toHaveLength(MAX_OVERDUE);
    // The cap keeps the most recent dates.
    expect(iso(list[list.length - 1]!)).toBe('2026-10-21');
  });

  test('marking paid walks forward one due date at a time and undo walks back', () => {
    let bill = rent();
    expect(iso(nextUnpaidDue(bill, TODAY))).toBe('2026-09-01');
    bill = { ...bill, paidThrough: paidThroughAfterMarking(bill, TODAY) };
    expect(bill.paidThrough).toBe('2026-09-01');
    bill = { ...bill, paidThrough: paidThroughAfterMarking(bill, TODAY) };
    expect(bill.paidThrough).toBe('2026-10-01');
    expect(overdueDates(bill, TODAY)).toEqual([]);
    // Paying ahead marks the upcoming date.
    bill = { ...bill, paidThrough: paidThroughAfterMarking(bill, TODAY) };
    expect(bill.paidThrough).toBe('2026-11-01');
    expect(isDatePaid(bill, new Date(2026, 10, 1))).toBe(true);
    expect(isDatePaid(bill, new Date(2026, 11, 1))).toBe(false);
    expect(iso(nextUnpaidDue(bill, TODAY))).toBe('2026-12-01');

    bill = { ...bill, paidThrough: paidThroughAfterUndo(bill) };
    expect(bill.paidThrough).toBe('2026-10-01');
    bill = { ...bill, paidThrough: paidThroughAfterUndo(bill) };
    expect(bill.paidThrough).toBe('2026-09-01');
    // The date before 1 Sep is before tracking started, so undo clears it.
    bill = { ...bill, paidThrough: paidThroughAfterUndo(bill) };
    expect(bill.paidThrough).toBeNull();
    expect(daysLate(new Date(2026, 9, 1), TODAY)).toBe(21);
  });
});

describe('bills in stats and lists', () => {
  test('nextEvent reports the oldest overdue date first', () => {
    const e = nextEvent(rent(), TODAY)!;
    expect(e.type).toBe('overdue');
    expect(iso(e.date)).toBe('2026-09-01');
    expect(eventLabel(e)).toBe('Overdue 51 days');
  });

  test('upcoming lists overdue dates first, skips paid dates and sums them', () => {
    const paidAhead = rent({ name: 'Water', price: 40, amountVaries: true, paidThrough: '2026-11-01', createdAt: '2026-10-01T00:00:00.000Z' });
    const events = upcomingEvents([rent(), paidAhead], TODAY, 30);
    expect(events.map((e) => `${e.subscription.name}:${e.type}:${iso(e.date)}`)).toEqual([
      'Rent:overdue:2026-09-01',
      'Rent:overdue:2026-10-01',
      'Rent:bill:2026-11-01',
    ]);
    expect(sumEvents(events, 'USD')).toBe(3600);
  });

  test('labels: due vs renews vs autopays, and ~ for varying amounts', () => {
    const today = TODAY;
    const autopay = rent({ autopay: true, firstBillDate: '2026-01-25' });
    expect(eventLabel(nextEvent(autopay, today)!)).toBe('Autopays in 3 days');
    const manual = rent({ firstBillDate: '2026-01-23', createdAt: '2026-10-20T00:00:00.000Z' });
    expect(eventLabel(nextEvent(manual, today)!)).toBe('Due tomorrow');
    expect(eventLabel(nextEvent(makeSub({ firstBillDate: '2026-01-22' }), today)!)).toBe('Renews today');
    expect(amountText(rent({ amountVaries: true, price: 85 }), 'en-US')).toBe('~$85.00');
    expect(amountText(rent({ price: 85 }), 'en-US')).toBe('$85.00');
  });

  test('totals and counts split bills from subscriptions', () => {
    const subs = [rent(), makeSub({ price: 10 }), makeSub({ price: 5, status: 'paused' }), rent({ name: 'Phone', autopay: true, price: 50 })];
    expect(totalsByKind(subs, 'month', 'USD', TODAY)).toEqual({ bills: 1250, subscriptions: 10, billCount: 2, subscriptionCount: 1 });
    expect(counts(subs, TODAY)).toMatchObject({ active: 3, bills: 2, subscriptions: 1, overdue: 1, paused: 1 });
  });

  test('the list can be filtered by kind', () => {
    const subs = [rent(), makeSub({ name: 'Netflix' })];
    expect(filterSubscriptions(subs, '', null, 'bill').map((s) => s.name)).toEqual(['Rent']);
    expect(filterSubscriptions(subs, '', null, 'subscription').map((s) => s.name)).toEqual(['Netflix']);
    expect(filterSubscriptions(subs, '', null)).toHaveLength(2);
  });
});
