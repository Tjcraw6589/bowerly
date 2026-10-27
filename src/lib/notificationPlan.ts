import { addDays, billDatesInRange, formatShortDate, parseISODate, startOfDay, toISODate } from './dates';
import { cycleShortLabel, formatMoney } from './money';
import { isDatePaid, isManualBill } from './payments';
import { isOnTrial } from './stats';
import type { Settings, Subscription } from './types';

export interface PlannedNotification {
  /** Stable key: item id, kind of reminder and the event date. */
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

function amountLabel(item: Subscription, locale: string): string {
  const money = formatMoney(item.price, item.currency, locale);
  return item.amountVaries ? `About ${money}` : money;
}

function dueTitle(item: Subscription, daysBefore: number, date: Date, locale: string): string {
  const when = whenLabel(daysBefore, date, locale);
  return item.kind === 'bill' ? `${item.name} is due ${when}` : `${item.name} renews ${when}`;
}

function dueBody(item: Subscription, daysBefore: number, date: Date, locale: string): string {
  const amount = amountLabel(item, locale);
  const on = daysBefore === 0 ? 'today' : `on ${formatShortDate(date, locale)}`;
  if (item.kind === 'subscription') return `${amount} will be charged ${on}.`;
  if (item.autopay) return `${amount} will be paid automatically ${on}.`;
  return `${amount} is due ${on}.`;
}

/**
 * Pure planner: given the current items and settings, returns every notification
 * that should be scheduled from `now` forward. The scheduler replaces whatever the
 * OS has pending with this plan.
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
            body: `You'll be charged ${formatMoney(sub.price, sub.currency, locale)}${cycleShortLabel(sub.cycle)} unless you cancel first.`,
          });
        }
      }
    }

    const manual = isManualBill(sub);
    for (const date of billDatesInRange(first, sub.cycle, today, horizon, 12)) {
      if (manual && isDatePaid(sub, date)) continue;
      const fireAt = fireTime(date, daysBefore, settings.reminderHour);
      if (fireAt.getTime() > now.getTime()) {
        planned.push({
          key: `${sub.id}|bill|${toISODate(date)}`,
          subscriptionId: sub.id,
          fireAt,
          title: dueTitle(sub, daysBefore, date, locale),
          body: dueBody(sub, daysBefore, date, locale),
        });
      }
      if (manual) {
        // A nudge the morning after the due date. Marking the bill paid reschedules and drops it.
        const lateAt = fireTime(addDays(date, 1), 0, settings.reminderHour);
        if (lateAt.getTime() > now.getTime()) {
          planned.push({
            key: `${sub.id}|late|${toISODate(date)}`,
            subscriptionId: sub.id,
            fireAt: lateAt,
            title: `${sub.name} is overdue`,
            body: `${amountLabel(sub, locale)} was due on ${formatShortDate(date, locale)}. Mark it paid once it's done.`,
          });
        }
      }
    }
  }

  planned.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
  return planned.slice(0, MAX_PLANNED_NOTIFICATIONS);
}
