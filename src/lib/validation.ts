import { isValidISODate, parseISODate } from './dates';
import type { SubscriptionDraft } from './types';

export interface DraftErrors {
  name?: string;
  price?: string;
  cycleEvery?: string;
  firstBillDate?: string;
  trialEndDate?: string;
  currency?: string;
}

export const MAX_NAME_LENGTH = 60;
export const MAX_NOTES_LENGTH = 500;

export function validateDraft(d: SubscriptionDraft): DraftErrors {
  const errors: DraftErrors = {};
  const name = d.name.trim();
  if (!name) errors.name = `Give this ${d.kind === 'bill' ? 'bill' : 'subscription'} a name.`;
  else if (name.length > MAX_NAME_LENGTH) errors.name = `Keep the name under ${MAX_NAME_LENGTH} characters.`;

  if (!Number.isFinite(d.price) || d.price < 0) errors.price = 'Enter a valid amount.';
  else if (d.price > 1_000_000) errors.price = 'That amount looks too large.';

  if (!Number.isInteger(d.cycle.every) || d.cycle.every < 1 || d.cycle.every > 365) {
    errors.cycleEvery = 'Repeat every 1 to 365 units.';
  }

  if (!/^[A-Z]{3}$/.test(d.currency)) errors.currency = 'Pick a currency.';

  if (!isValidISODate(d.firstBillDate)) errors.firstBillDate = 'Pick a valid date.';

  if (d.trialEndDate !== null) {
    if (!isValidISODate(d.trialEndDate)) errors.trialEndDate = 'Pick a valid trial end date.';
    else if (!errors.firstBillDate) {
      const trialEnd = parseISODate(d.trialEndDate);
      const first = parseISODate(d.firstBillDate);
      if (trialEnd && first && first.getTime() <= trialEnd.getTime()) {
        errors.firstBillDate = 'The first paid bill must come after the trial ends.';
      }
    }
  }
  return errors;
}

export function hasErrors(errors: DraftErrors): boolean {
  return Object.values(errors).some((v) => v !== undefined);
}
