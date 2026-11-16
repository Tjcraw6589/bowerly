import { addDays, daysBetween, isOneTime, nextBillIndex, nthBillDate, parseISODate, startOfDay, toISODate } from './dates';
import type { Subscription } from './types';

/** Overdue lists are capped so a years-old untouched bill cannot produce thousands of rows. */
export const MAX_OVERDUE = 24;

/** A bill the user pays by hand: it can be marked paid and can become overdue. */
export function isManualBill(item: Subscription): boolean {
  return item.kind === 'bill' && !item.autopay;
}

/**
 * The first date we hold a manual bill to: the day it was added to the app.
 * Due dates before that were (presumably) handled before the user started tracking.
 */
export function trackingStart(item: Subscription): Date {
  const created = new Date(item.createdAt);
  return Number.isNaN(created.getTime()) ? new Date(0) : startOfDay(created);
}

function paidThroughDate(item: Subscription): Date | null {
  return item.paidThrough ? parseISODate(item.paidThrough) : null;
}

/** Index of the oldest due date that is tracked and not yet marked paid. */
function firstUnpaidIndex(item: Subscription, first: Date): number {
  const start = trackingStart(item);
  const paid = paidThroughDate(item);
  const afterPaid = paid ? addDays(paid, 1) : null;
  const lowest = afterPaid && afterPaid.getTime() > start.getTime() ? afterPaid : start;
  return nextBillIndex(first, item.cycle, lowest);
}

/**
 * Due dates strictly before today that are on/after tracking started and not marked paid.
 * Oldest first, so the list starts with the one "mark paid" acts on; capped at MAX_OVERDUE
 * (use overdueCount for the true number).
 */
export function overdueDates(item: Subscription, today: Date): Date[] {
  if (item.status !== 'active' || !isManualBill(item)) return [];
  const first = parseISODate(item.firstBillDate);
  if (!first) return [];
  const t = startOfDay(today).getTime();
  const out: Date[] = [];
  for (let n = firstUnpaidIndex(item, first); out.length < MAX_OVERDUE; n++) {
    const d = nthBillDate(first, item.cycle, n);
    if (d.getTime() >= t) break;
    out.push(d);
  }
  return out;
}

/** How many due dates are overdue, without the display cap. */
export function overdueCount(item: Subscription, today: Date): number {
  if (item.status !== 'active' || !isManualBill(item)) return 0;
  const first = parseISODate(item.firstBillDate);
  if (!first) return 0;
  return Math.max(0, nextBillIndex(first, item.cycle, startOfDay(today)) - firstUnpaidIndex(item, first));
}

/**
 * The next due date that still needs paying: the oldest overdue date if any, otherwise the first
 * upcoming due date after anything already marked paid. For subscriptions and autopaid bills this
 * is simply the next charge on or after today. Null once a one time payment is done: marked paid,
 * or (when nobody marks it) its date has passed.
 */
export function nextUnpaidDue(item: Subscription, today: Date): Date | null {
  const first = parseISODate(item.firstBillDate);
  if (!first) return null;
  const t = startOfDay(today);
  const upcoming = nextBillIndex(first, item.cycle, t);
  let n = upcoming;
  if (isManualBill(item)) {
    const unpaid = firstUnpaidIndex(item, first);
    // A paused or cancelled bill owes nothing from the past; only active ones can be overdue.
    n = item.status === 'active' ? unpaid : Math.max(unpaid, upcoming);
  }
  if (isOneTime(item.cycle) && n > 0) return null;
  return nthBillDate(first, item.cycle, n);
}

/** The date of a one time payment that is done (marked paid, or already charged); null otherwise. */
export function oneTimePaidOn(item: Subscription, today: Date): Date | null {
  if (!isOneTime(item.cycle)) return null;
  const date = parseISODate(item.firstBillDate);
  if (!date || nextUnpaidDue(item, today) !== null) return null;
  return date;
}

/** Marks the next unpaid due date as paid and returns the new paidThrough value. */
export function paidThroughAfterMarking(item: Subscription, today: Date): string | null {
  const due = nextUnpaidDue(item, today);
  return due ? toISODate(due) : item.paidThrough;
}

/**
 * Undoes the last "mark paid": moves paidThrough back one due date, or clears it when
 * the previous due date is before tracking started.
 */
export function paidThroughAfterUndo(item: Subscription): string | null {
  const paid = paidThroughDate(item);
  const first = parseISODate(item.firstBillDate);
  if (!paid || !first) return null;
  // The last due date on or before paidThrough. Usually paidThrough is that date itself, but after
  // the due date is edited it can fall between due dates; undo must still un-mark one due date.
  const idx = nextBillIndex(first, item.cycle, addDays(paid, 1)) - 1;
  if (idx <= 0) return null;
  const previous = nthBillDate(first, item.cycle, idx - 1);
  return previous.getTime() < trackingStart(item).getTime() ? null : toISODate(previous);
}

/**
 * When the due day or how often a hand-paid bill repeats is edited, keep how many tracked due
 * dates were already paid rather than the old date. Paying August's rent on the 5th and then
 * moving the due day to the 20th must not make 20 August look unpaid.
 */
export function paidThroughAfterReschedule(before: Subscription, after: Subscription): string | null {
  if (!isManualBill(after) || !before.paidThrough) return after.paidThrough;
  const sameSchedule = before.firstBillDate === after.firstBillDate && before.cycle.every === after.cycle.every && before.cycle.unit === after.cycle.unit;
  if (sameSchedule || after.paidThrough !== before.paidThrough) return after.paidThrough;
  // A one time payment that was paid stays paid when only its date moves. A repeating bill turned
  // into a one time payment starts unpaid: its earlier payments were for other dates.
  if (isOneTime(after.cycle)) return isOneTime(before.cycle) ? after.firstBillDate : null;
  const oldFirst = parseISODate(before.firstBillDate);
  const newFirst = parseISODate(after.firstBillDate);
  const paid = paidThroughDate(before);
  if (!oldFirst || !newFirst || !paid) return after.paidThrough;
  const start = trackingStart(before);
  // Tracked due dates the user had marked paid under the old schedule.
  const paidCount = nextBillIndex(oldFirst, before.cycle, addDays(paid, 1)) - nextBillIndex(oldFirst, before.cycle, start);
  if (paidCount <= 0) return null;
  const firstTracked = nextBillIndex(newFirst, after.cycle, start);
  return toISODate(nthBillDate(newFirst, after.cycle, firstTracked + paidCount - 1));
}

/**
 * When a paused or cancelled hand-paid bill is turned back on, due dates that passed while it was
 * off are not owed, so they should not all show up as overdue. paidThrough is a single "paid up to"
 * date, so this only moves it forward when nothing was owed from before the pause; otherwise the
 * old unpaid dates stay visible rather than being silently marked paid. The pause day is taken from
 * updatedAt, which is the last change (an edit while paused only makes this more conservative).
 */
export function paidThroughOnResume(item: Subscription, now: Date): string | null {
  if (!isManualBill(item) || item.status === 'active') return item.paidThrough;
  const first = parseISODate(item.firstBillDate);
  // When charging stopped: the recorded pause or cancel time, else (older data) the last change.
  const changed = new Date(item.pausedAt ?? item.cancelledAt ?? item.updatedAt);
  if (!first || Number.isNaN(changed.getTime())) return item.paidThrough;
  const since = startOfDay(changed);
  const today = startOfDay(now);
  if (overdueDates({ ...item, status: 'active' }, since).length > 0) return item.paidThrough;
  const idx = nextBillIndex(first, item.cycle, today) - 1;
  if (idx < 0) return item.paidThrough;
  const last = nthBillDate(first, item.cycle, idx);
  if (last.getTime() < since.getTime()) return item.paidThrough;
  const paid = paidThroughDate(item);
  if (paid && last.getTime() <= paid.getTime()) return item.paidThrough;
  return toISODate(last);
}

/** True when the given due date has been marked paid. */
export function isDatePaid(item: Subscription, date: Date): boolean {
  const paid = paidThroughDate(item);
  return paid !== null && startOfDay(date).getTime() <= paid.getTime();
}

/** Whole calendar days a due date is late (1 = due yesterday). */
export function daysLate(due: Date, today: Date): number {
  return daysBetween(due, today);
}
