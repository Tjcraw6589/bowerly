import { relativeDayLabel } from './dates';
import { formatMoney } from './money';
import type { ItemKind, Subscription, UpcomingEvent } from './types';

/** "Bill" or "Subscription". */
export function kindLabel(kind: ItemKind): string {
  return kind === 'bill' ? 'Bill' : 'Subscription';
}

/** The amount, with a leading "~" when it changes from bill to bill. */
export function amountText(item: Subscription, locale: string, amount = item.price): string {
  const money = formatMoney(amount, item.currency, locale);
  return item.amountVaries ? `~${money}` : money;
}

/** How a charge happens: "Renews" (subscription), "Autopays" (autopaid bill) or "Due" (paid by hand). */
export function chargeVerb(item: Subscription): string {
  if (item.kind === 'subscription') return 'Renews';
  return item.autopay ? 'Autopays' : 'Due';
}

/** "Overdue 3 days", "Trial ends tomorrow", "Due in 4 days", "Renews today". */
export function eventLabel(event: UpcomingEvent): string {
  if (event.type === 'overdue') {
    const late = -event.daysUntil;
    return late === 1 ? 'Overdue 1 day' : `Overdue ${late} days`;
  }
  const verb = event.type === 'trialEnd' ? 'Trial ends' : chargeVerb(event.subscription);
  return `${verb} ${relativeDayLabel(event.daysUntil).toLowerCase()}`;
}

/** "Due on", "Renews on" or "Autopays on", for detail screens. */
export function nextChargeHeading(item: Subscription): string {
  if (item.kind === 'subscription') return 'Next renewal';
  return item.autopay ? 'Next autopay' : 'Next due';
}

/** "How it's paid": shown on bills. */
export function paymentMethodLabel(item: Subscription): string {
  if (item.kind === 'subscription') return 'Renews automatically';
  return item.autopay ? 'Autopay' : 'Paid by hand';
}
