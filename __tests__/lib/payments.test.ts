import { amountText, eventLabel } from '@/lib/labels';
import {
  daysLate,
  isDatePaid,
  isManualBill,
  MAX_OVERDUE,
  nextUnpaidDue,
  overdueCount,
  overdueDates,
  paidThroughAfterMarking,
  paidThroughAfterReschedule,
  paidThroughAfterUndo,
  paidThroughOnResume,
} from '@/lib/payments';
import { counts, nextEvent, sumEvents, totalsByKind, upcomingEvents } from '@/lib/stats';
import { filterSubscriptions } from '@/lib/sort';
import { toISODate } from '@/lib/dates';

import { makeSub, TODAY, local } from '../helpers';

/** Rent due on the 1st, paid by hand, tracked since 1 Sep 2026. Today is 22 Oct 2026. */
function rent(overrides = {}) {
  return makeSub({
    name: 'Rent',
    kind: 'bill',
    autopay: false,
    price: 1200,
    firstBillDate: '2026-01-01',
    createdAt: local('2026-09-01T12:00'),
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
    const dueToday = rent({ firstBillDate: '2026-01-22', createdAt: local('2026-10-22T08:00') });
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
    const weekly = rent({ cycle: { every: 1, unit: 'week' }, createdAt: local('2020-01-01T00:00'), firstBillDate: '2020-01-01' });
    const list = overdueDates(weekly, TODAY);
    expect(list).toHaveLength(MAX_OVERDUE);
    // The list starts with the oldest unpaid date, the one "mark paid" acts on.
    expect(iso(list[0]!)).toBe('2020-01-01');
    // The true count is not capped (every Wednesday from 1 Jan 2020 to 21 Oct 2026).
    expect(overdueCount(weekly, TODAY)).toBe(356);
  });

  test('marking paid on a long overdue bill pays the oldest date, never silently skips older ones', () => {
    let weekly = rent({ cycle: { every: 1, unit: 'week' }, createdAt: local('2020-01-01T00:00'), firstBillDate: '2020-01-01' });
    weekly = { ...weekly, paidThrough: paidThroughAfterMarking(weekly, TODAY) };
    expect(weekly.paidThrough).toBe('2020-01-01');
    expect(overdueCount(weekly, TODAY)).toBe(355);
    expect(iso(overdueDates(weekly, TODAY)[0]!)).toBe('2020-01-08');
    // Undo goes back to nothing paid.
    expect(paidThroughAfterUndo(weekly)).toBeNull();
  });

  test('undo still un-marks a due date after the due day was edited', () => {
    // Paid through 15 Sep, then the due day moved from the 15th to the 1st.
    const bill = rent({ firstBillDate: '2026-01-01', createdAt: local('2026-01-01T00:00'), paidThrough: '2026-09-15' });
    // Paid covers up to 1 Sep; undo must step back to 1 Aug, not stay at 1 Sep.
    expect(paidThroughAfterUndo(bill)).toBe('2026-08-01');
    expect(iso(nextUnpaidDue({ ...bill, paidThrough: paidThroughAfterUndo(bill) }, TODAY))).toBe('2026-09-01');
  });

  test('a paused hand paid bill owes nothing from the past', () => {
    const paused = rent({ status: 'paused' });
    expect(overdueDates(paused, TODAY)).toEqual([]);
    expect(overdueCount(paused, TODAY)).toBe(0);
    expect(iso(nextUnpaidDue(paused, TODAY))).toBe('2026-11-01');
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
    const paidAhead = rent({ name: 'Water', price: 40, amountVaries: true, paidThrough: '2026-11-01', createdAt: local('2026-10-01T00:00') });
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
    const manual = rent({ firstBillDate: '2026-01-23', createdAt: local('2026-10-20T00:00') });
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

describe('resuming a paused hand-paid bill', () => {
  // Rent paid through 1 Aug, paused on 15 Aug, resumed today (22 Oct): 1 Sep and 1 Oct fell due while paused.
  const paused = (overrides = {}) =>
    rent({ status: 'paused', paidThrough: '2026-08-01', createdAt: local('2026-07-01T12:00'), updatedAt: local('2026-08-15T12:00'), ...overrides });

  test('due dates that passed while paused are not owed', () => {
    const resumed = { ...paused(), status: 'active' as const, paidThrough: paidThroughOnResume(paused(), TODAY) };
    expect(resumed.paidThrough).toBe('2026-10-01');
    expect(overdueDates(resumed, TODAY)).toEqual([]);
    expect(iso(nextUnpaidDue(resumed, TODAY))).toBe('2026-11-01');
  });

  test('an edit made while paused does not move the pause date', () => {
    // Paused 15 Aug (recorded), then renamed on 20 Oct. The pause date, not the edit, decides.
    const edited = paused({ pausedAt: local('2026-08-15T12:00'), updatedAt: local('2026-10-20T12:00') });
    expect(paidThroughOnResume(edited, TODAY)).toBe('2026-10-01');
    // Older data has no recorded pause date, so the last change stands in for it. Seen from 20 Oct,
    // 1 Sep and 1 Oct look owed, so the conservative rule keeps them visible rather than settling them.
    expect(paidThroughOnResume(paused({ updatedAt: local('2026-10-20T12:00') }), TODAY)).toBe('2026-08-01');
  });

  test('a bill already overdue before the pause keeps its unpaid dates', () => {
    // Paid only through 1 Jul, so 1 Aug was unpaid when it was paused on 15 Aug.
    const owed = paused({ paidThrough: '2026-07-01' });
    expect(paidThroughOnResume(owed, TODAY)).toBe('2026-07-01');
  });

  test('pausing and resuming the same day changes nothing', () => {
    const sameDay = paused({ paidThrough: null, createdAt: local('2026-09-01T12:00'), updatedAt: local('2026-10-22T09:00') });
    // 1 Oct is overdue (tracked since 1 Sep, 1 Sep itself unpaid too), so nothing is settled.
    expect(paidThroughOnResume(sameDay, TODAY)).toBeNull();
  });

  test('nothing due during the pause leaves paidThrough alone; other kinds are untouched', () => {
    expect(paidThroughOnResume(paused({ paidThrough: '2026-10-01', updatedAt: local('2026-10-05T12:00') }), TODAY)).toBe('2026-10-01');
    expect(paidThroughOnResume(paused({ autopay: true, paidThrough: null }), TODAY)).toBeNull();
    expect(paidThroughOnResume(rent({ paidThrough: '2026-08-01' }), TODAY)).toBe('2026-08-01');
  });
});

describe('editing the schedule of a hand paid bill', () => {
  // Added 2 July, rent due on the 5th from 5 August, August marked paid.
  const base = () =>
    makeSub({ name: 'Rent', kind: 'bill', autopay: false, price: 1200, firstBillDate: '2026-08-05', createdAt: local('2026-07-02T10:00'), paidThrough: '2026-08-05' });

  test('moving the due day later keeps August paid', () => {
    const before = base();
    const after = { ...before, firstBillDate: '2026-08-20' };
    const paid = paidThroughAfterReschedule(before, after);
    expect(paid).toBe('2026-08-20');
    const moved = { ...after, paidThrough: paid };
    expect(overdueDates(moved, TODAY).map(iso)).toEqual(['2026-09-20', '2026-10-20']);
  });

  test('moving the due day earlier keeps the same number paid', () => {
    const before = { ...base(), firstBillDate: '2026-08-20', paidThrough: '2026-09-20' };
    expect(paidThroughAfterReschedule(before, { ...before, firstBillDate: '2026-08-05' })).toBe('2026-09-05');
  });

  test('changing how often it repeats keeps the count too', () => {
    const before = { ...base(), paidThrough: '2026-09-05' };
    expect(paidThroughAfterReschedule(before, { ...before, cycle: { every: 2, unit: 'week' as const } })).toBe('2026-08-19');
  });

  test('leaves it alone when the schedule did not change or the date was set on purpose', () => {
    const before = base();
    expect(paidThroughAfterReschedule(before, { ...before, name: 'Flat' })).toBe('2026-08-05');
    expect(paidThroughAfterReschedule(before, { ...before, firstBillDate: '2026-08-20', paidThrough: null })).toBeNull();
  });

  test('a paid date from before tracking started counts as nothing paid', () => {
    const before = { ...base(), firstBillDate: '2026-06-05', paidThrough: '2026-06-05' };
    expect(paidThroughAfterReschedule(before, { ...before, firstBillDate: '2026-06-20' })).toBeNull();
  });
});
