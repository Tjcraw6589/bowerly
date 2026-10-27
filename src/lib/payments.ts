import { daysBetween, nextBillIndex, nthBillDate, parseISODate, startOfDay, toISODate } from './dates';
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

/** Due dates strictly before today that are on/after tracking started and not marked paid. Oldest first. */
export function overdueDates(item: Subscription, today: Date): Date[] {
  if (item.status !== 'active' || !isManualBill(item)) return [];
  const first = parseISODate(item.firstBillDate);
  if (!first) return [];
  const t = startOfDay(today);
  const start = trackingStart(item);
  const paid = paidThroughDate(item);
  const out: Date[] = [];
  // Walk back from the most recent past due date; stop at tracking start or the paid-through date.
  let n = nextBillIndex(first, item.cycle, t) - 1;
  while (n >= 0 && out.length < MAX_OVERDUE) {
    const d = nthBillDate(first, item.cycle, n);
    if (d.getTime() < start.getTime()) break;
    if (paid && d.getTime() <= paid.getTime()) break;
    out.push(d);
    n--;
  }
  return out.reverse();
}

/**
 * The next due date that still needs paying: the oldest overdue date if any, otherwise the first
 * upcoming due date after anything already marked paid. For subscriptions and autopaid bills this
 * is simply the next charge on or after today.
 */
export function nextUnpaidDue(item: Subscription, today: Date): Date | null {
  const first = parseISODate(item.firstBillDate);
  if (!first) return null;
  const t = startOfDay(today);
  if (!isManualBill(item)) return nthBillDate(first, item.cycle, nextBillIndex(first, item.cycle, t));
  const overdue = overdueDates(item, t);
  if (overdue.length > 0) return overdue[0] ?? null;
  const paid = paidThroughDate(item);
  let n = nextBillIndex(first, item.cycle, t);
  let d = nthBillDate(first, item.cycle, n);
  while (paid && d.getTime() <= paid.getTime()) {
    n++;
    d = nthBillDate(first, item.cycle, n);
  }
  return d;
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
  const idx = nextBillIndex(first, item.cycle, paid); // index of the paid date itself
  if (idx <= 0) return null;
  const previous = nthBillDate(first, item.cycle, idx - 1);
  return previous.getTime() < trackingStart(item).getTime() ? null : toISODate(previous);
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
