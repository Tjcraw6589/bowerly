import { BUILT_IN_CATEGORIES } from '@/lib/categories';
import { parseSubscriptionsCSV, subscriptionsToCSV } from '@/lib/csv';
import { billDatesInRange, billsOnOrBefore, nextBillIndex, toISODate, upcomingBillDates } from '@/lib/dates';
import { chargeVerb, nextChargeHeading, paymentMethodLabel } from '@/lib/labels';
import { cycleLabel, cycleShortLabel, monthlyCost, ONE_TIME, yearlyCost } from '@/lib/money';
import { buildNotificationPlan } from '@/lib/notificationPlan';
import {
  nextUnpaidDue,
  oneTimePaidOn,
  overdueCount,
  overdueDates,
  paidThroughAfterMarking,
  paidThroughAfterReschedule,
  paidThroughAfterUndo,
} from '@/lib/payments';
import { sortSubscriptions } from '@/lib/sort';
import { monthlyTimeline, nextEvent, paidToDate, totalsByCurrency, upcomingEvents } from '@/lib/stats';
import type { Settings } from '@/lib/types';

import { local, makeSub, TODAY } from '../helpers';

// TODAY is 22 Oct 2026.
const iso = (d: Date | null) => (d ? toISODate(d) : null);

/** A one time bill paid by hand, added to the app on 1 Oct 2026. */
function repair(overrides = {}) {
  return makeSub({
    name: 'Car repair',
    kind: 'bill',
    autopay: false,
    price: 400,
    cycle: ONE_TIME,
    firstBillDate: '2026-10-30',
    createdAt: local('2026-10-01T12:00'),
    categoryId: 'cat_transport',
    ...overrides,
  });
}

/** A one time charge taken automatically, like a signup fee. */
function fee(overrides = {}) {
  return makeSub({ name: 'Signup fee', price: 50, cycle: ONE_TIME, firstBillDate: '2026-10-25', ...overrides });
}

describe('one time dates', () => {
  const first = new Date(2026, 9, 30);

  test('there is only ever one date', () => {
    expect(nextBillIndex(first, ONE_TIME, TODAY)).toBe(0);
    expect(nextBillIndex(first, ONE_TIME, new Date(2026, 10, 2))).toBe(1);
    expect(upcomingBillDates(first, ONE_TIME, TODAY, 5).map(toISODate)).toEqual(['2026-10-30']);
    expect(upcomingBillDates(first, ONE_TIME, new Date(2026, 10, 2), 5)).toEqual([]);
    expect(billDatesInRange(first, ONE_TIME, TODAY, new Date(2027, 11, 31)).map(toISODate)).toEqual(['2026-10-30']);
    expect(billsOnOrBefore(first, ONE_TIME, new Date(2026, 9, 29))).toBe(0);
    expect(billsOnOrBefore(first, ONE_TIME, new Date(2030, 0, 1))).toBe(1);
  });

  test('labels and costs', () => {
    expect(cycleLabel(ONE_TIME)).toBe('One time');
    expect(cycleShortLabel(ONE_TIME)).toBe(' once');
    expect(monthlyCost(400, ONE_TIME)).toBe(0);
    expect(yearlyCost(400, ONE_TIME)).toBe(0);
    expect(cycleLabel({ every: 2, unit: 'week' })).toBe('Every 2 weeks');
  });
});

describe('one time bills paid by hand', () => {
  test('due, then overdue, then done once marked paid', () => {
    const bill = repair();
    expect(iso(nextUnpaidDue(bill, TODAY))).toBe('2026-10-30');
    expect(nextEvent(bill, TODAY)).toMatchObject({ type: 'bill', daysUntil: 8 });
    expect(oneTimePaidOn(bill, TODAY)).toBeNull();

    const late = new Date(2026, 10, 3);
    expect(overdueDates(bill, late).map(toISODate)).toEqual(['2026-10-30']);
    expect(overdueCount(bill, late)).toBe(1);
    expect(nextEvent(bill, late)).toMatchObject({ type: 'overdue' });

    const paid = { ...bill, paidThrough: paidThroughAfterMarking(bill, late) };
    expect(paid.paidThrough).toBe('2026-10-30');
    expect(nextUnpaidDue(paid, late)).toBeNull();
    expect(nextEvent(paid, late)).toBeNull();
    expect(overdueDates(paid, late)).toEqual([]);
    expect(iso(oneTimePaidOn(paid, late))).toBe('2026-10-30');

    expect(paidThroughAfterUndo(paid)).toBeNull();
  });

  test('marking it paid early also finishes it', () => {
    const paid = { ...repair(), paidThrough: '2026-10-30' };
    expect(nextEvent(paid, TODAY)).toBeNull();
    expect(upcomingEvents([paid], TODAY, 30)).toEqual([]);
  });

  test('moving the date keeps it paid; turning a repeating bill into one time starts unpaid', () => {
    const paid = repair({ paidThrough: '2026-10-30' });
    expect(paidThroughAfterReschedule(paid, { ...paid, firstBillDate: '2026-11-05' })).toBe('2026-11-05');
    const rent = repair({ cycle: { every: 1, unit: 'month' }, firstBillDate: '2026-01-01', paidThrough: '2026-10-01' });
    expect(paidThroughAfterReschedule(rent, { ...rent, cycle: ONE_TIME, firstBillDate: '2026-12-01' })).toBeNull();
  });
});

describe('one time charges taken automatically', () => {
  test('upcoming until the date, then done', () => {
    const f = fee();
    expect(nextEvent(f, TODAY)).toMatchObject({ type: 'bill', daysUntil: 3 });
    expect(chargeVerb(f)).toBe('Charges');
    expect(nextChargeHeading(f)).toBe('Charge');
    expect(paymentMethodLabel(f)).toBe('Charged automatically');
    const after = new Date(2026, 9, 26);
    expect(nextEvent(f, after)).toBeNull();
    expect(iso(oneTimePaidOn(f, after))).toBe('2026-10-25');
    expect(paidToDate(f, after)).toBe(50);
  });
});

describe('one time payments in totals', () => {
  test('left out of monthly totals, counted in upcoming and the timeline', () => {
    const monthly = makeSub({ price: 10 });
    const f = fee();
    expect(totalsByCurrency([monthly, f], 'month', 'USD', TODAY)[0]).toMatchObject({ amount: 10, count: 1 });
    expect(upcomingEvents([monthly, f], TODAY, 30).map((e) => e.subscription.name)).toContain('Signup fee');
    const october = monthlyTimeline([f], TODAY, 'USD', 3)[0];
    expect(october).toMatchObject({ key: '2026-10', amount: 50 });
  });

  test('price sorting uses the whole amount', () => {
    const big = repair({ name: 'Big', price: 400 });
    const small = makeSub({ name: 'Small', price: 20 });
    expect(sortSubscriptions([small, big], 'priceDesc', TODAY).map((s) => s.name)).toEqual(['Big', 'Small']);
  });
});

describe('one time reminders', () => {
  const settings: Settings = {
    currency: 'USD',
    theme: 'system',
    reminderHour: 9,
    notificationsEnabled: true,
    onboardingComplete: true,
    summaryPeriod: 'month',
    sortBy: 'nextBill',
  };

  test('one reminder before the date and nothing after it', () => {
    const plan = buildNotificationPlan([fee()], settings, new Date(2026, 9, 22, 10, 30));
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ title: 'Signup fee is charged tomorrow', fireAt: new Date(2026, 9, 24, 9, 0, 0, 0) });
    expect(buildNotificationPlan([fee()], settings, new Date(2026, 9, 26, 10, 0))).toEqual([]);
  });

  test('a hand paid one time bill gets its reminder and an overdue nudge', () => {
    const plan = buildNotificationPlan([repair()], settings, new Date(2026, 9, 22, 10, 30));
    expect(plan.map((p) => p.title)).toEqual(['Car repair is due tomorrow', 'Car repair is overdue']);
  });
});

describe('one time payments in CSV', () => {
  const defaults = { currency: 'USD', today: TODAY, newCategoryId: () => 'cat_new' };

  test('round trips and reads "one time" with any count', () => {
    const csv = subscriptionsToCSV([repair()], BUILT_IN_CATEGORIES);
    const back = parseSubscriptionsCSV(csv, BUILT_IN_CATEGORIES, defaults);
    expect(back.errors).toEqual([]);
    expect(back.drafts[0]?.cycle).toEqual(ONE_TIME);

    const typed = parseSubscriptionsCSV('name,price,cycle_every,cycle_unit\nDeposit,100,3,one time\n', BUILT_IN_CATEGORIES, defaults);
    expect(typed.errors).toEqual([]);
    expect(typed.drafts[0]?.cycle).toEqual(ONE_TIME);
  });
});
