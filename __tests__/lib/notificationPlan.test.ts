import { buildNotificationPlan, MAX_PLANNED_NOTIFICATIONS } from '@/lib/notificationPlan';
import type { Settings } from '@/lib/types';

import { makeSub } from '../helpers';

const now = new Date(2026, 9, 22, 10, 30); // 22 Oct 2026, 10:30
const settings: Settings = {
  currency: 'USD',
  theme: 'system',
  reminderHour: 9,
  notificationsEnabled: true,
  onboardingComplete: true,
  summaryPeriod: 'month',
  sortBy: 'nextBill',
};

describe('buildNotificationPlan', () => {
  test('schedules a reminder the configured days before each bill at the chosen hour', () => {
    const sub = makeSub({ name: 'Netflix', price: 15.49, firstBillDate: '2026-01-25', reminderDaysBefore: 1 });
    const plan = buildNotificationPlan([sub], settings, now);
    expect(plan.length).toBeGreaterThanOrEqual(2);
    const first = plan[0]!;
    expect(first.fireAt).toEqual(new Date(2026, 9, 24, 9, 0, 0, 0));
    expect(first.title).toBe('Netflix renews tomorrow');
    expect(first.body).toBe('$15.49 will be charged on Oct 25.');
    expect(first.key).toBe(`${sub.id}|bill|2026-10-25`);
    expect(plan[1]!.fireAt).toEqual(new Date(2026, 10, 24, 9, 0, 0, 0));
  });

  test('skips reminders whose fire time has already passed', () => {
    const sub = makeSub({ firstBillDate: '2026-10-22', reminderDaysBefore: 1 });
    const plan = buildNotificationPlan([sub], settings, now);
    expect(plan.every((p) => p.fireAt.getTime() > now.getTime())).toBe(true);
    expect(plan[0]!.key.endsWith('2026-11-22')).toBe(true);
  });

  test('same-day reminders fire on the bill date if the hour is still ahead', () => {
    const sub = makeSub({ name: 'Gym', firstBillDate: '2026-10-22', reminderDaysBefore: 0 });
    const early = new Date(2026, 9, 22, 7, 0);
    const plan = buildNotificationPlan([sub], settings, early);
    expect(plan[0]!.fireAt).toEqual(new Date(2026, 9, 22, 9, 0, 0, 0));
    expect(plan[0]!.title).toBe('Gym renews today');
    expect(plan[0]!.body).toBe('$10.00 will be charged today.');
  });

  test('adds a trial-ending reminder before the first paid bill', () => {
    const sub = makeSub({ name: 'Audible', price: 14.95, trialEndDate: '2026-10-30', firstBillDate: '2026-10-31', reminderDaysBefore: 3 });
    const plan = buildNotificationPlan([sub], settings, now);
    expect(plan[0]!.key).toBe(`${sub.id}|trial|2026-10-30`);
    expect(plan[0]!.fireAt).toEqual(new Date(2026, 9, 27, 9, 0, 0, 0));
    expect(plan[0]!.title).toBe('Audible trial ends on Oct 30');
    expect(plan[0]!.body).toBe("You'll be charged $14.95/mo unless you cancel first.");
    expect(plan[1]!.key).toBe(`${sub.id}|bill|2026-10-31`);
  });

  test('ignores paused, cancelled and reminder-less subscriptions, and everything when disabled', () => {
    const subs = [
      makeSub({ status: 'paused' }),
      makeSub({ status: 'cancelled' }),
      makeSub({ reminderDaysBefore: null }),
      makeSub({ firstBillDate: '2026-10-25' }),
    ];
    const plan = buildNotificationPlan(subs, settings, now);
    expect(plan.every((p) => p.subscriptionId === subs[3]!.id)).toBe(true);
    expect(buildNotificationPlan(subs, { ...settings, notificationsEnabled: false }, now)).toEqual([]);
  });

  test('stays under the platform limit and is sorted by time', () => {
    const subs = Array.from({ length: 30 }, (_, i) => makeSub({ cycle: { every: 1, unit: 'week' }, firstBillDate: `2026-10-${(i % 7) + 22}`.replace(/-(\d)$/, '-0$1') }));
    const plan = buildNotificationPlan(subs, settings, now);
    expect(plan.length).toBeLessThanOrEqual(MAX_PLANNED_NOTIFICATIONS);
    for (let i = 1; i < plan.length; i++) expect(plan[i]!.fireAt.getTime()).toBeGreaterThanOrEqual(plan[i - 1]!.fireAt.getTime());
  });
});
