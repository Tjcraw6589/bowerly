import { addDays, billDatesInRange, formatShortDate, parseISODate, startOfDay, toISODate } from './dates';
import { cycleShortLabel, formatMoney } from './money';
import { isOnTrial } from './stats';
import type { Settings, Subscription } from './types';

export interface PlannedNotification {
  /** Stable key: subscription id, kind and the event date. */
  key: string;
  subscriptionId: string;
  fireAt: Date;
  title: string;
  body: string;
}

/** iOS keeps at most 64 pending local notifications per app; stay under it. */
export const MAX_PLANNED_NOTIFICATIONS = 60;
export const PLAN_HORIZON_DAYS = 60;

function fireTime(eventDate: Date, daysBefore: number, hour: number): Date {
  const d = addDays(eventDate, -daysBefore);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0, 0, 0);
}

function whenLabel(daysBefore: number, eventDate: Date, locale: string): string {
  if (daysBefore === 0) return 'today';
  if (daysBefore === 1) return 'tomorrow';
  return `on ${formatShortDate(eventDate, locale)}`;
}

/**
 * Pure planner: given the current subscriptions and settings, returns every
 * notification that should be scheduled from `now` forward. The scheduler
 * diffs this against what the OS has pending.
 */
export function buildNotificationPlan(
  subs: readonly Subscription[],
  settings: Settings,
  now: Date,
  locale = 'en-US',
): PlannedNotification[] {
  if (!settings.notificationsEnabled) return [];
  const today = startOfDay(now);
  const horizon = addDays(today, PLAN_HORIZON_DAYS);
  const planned: PlannedNotification[] = [];

  for (const sub of subs) {
    if (sub.status !== 'active' || sub.reminderDaysBefore === null) continue;
    const first = parseISODate(sub.firstBillDate);
    if (!first) continue;
    const daysBefore = sub.reminderDaysBefore;
    const price = formatMoney(sub.price, sub.currency, locale);

    if (isOnTrial(sub, today)) {
      const trialEnd = parseISODate(sub.trialEndDate ?? '');
      if (trialEnd && trialEnd.getTime() <= horizon.getTime()) {
        const fireAt = fireTime(trialEnd, daysBefore, settings.reminderHour);
        if (fireAt.getTime() > now.getTime()) {
          planned.push({
            key: `${sub.id}|trial|${toISODate(trialEnd)}`,
            subscriptionId: sub.id,
            fireAt,
            title: `${sub.name} trial ends ${whenLabel(daysBefore, trialEnd, locale)}`,
            body: `You'll be charged ${price}${cycleShortLabel(sub.cycle)} unless you cancel first.`,
          });
        }
      }
    }

    for (const date of billDatesInRange(first, sub.cycle, today, horizon, 12)) {
      const fireAt = fireTime(date, daysBefore, settings.reminderHour);
      if (fireAt.getTime() <= now.getTime()) continue;
      planned.push({
        key: `${sub.id}|bill|${toISODate(date)}`,
        subscriptionId: sub.id,
        fireAt,
        title: `${sub.name} renews ${whenLabel(daysBefore, date, locale)}`,
        body: `${price} will be charged${daysBefore === 0 ? ' today' : ` on ${formatShortDate(date, locale)}`}.`,
      });
    }
  }

  planned.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
  return planned.slice(0, MAX_PLANNED_NOTIFICATIONS);
}
