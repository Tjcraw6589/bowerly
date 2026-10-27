export type CycleUnit = 'day' | 'week' | 'month' | 'year';

export interface BillingCycle {
  /** Number of units between bills, e.g. every 2 weeks. Always a positive integer. */
  every: number;
  unit: CycleUnit;
}

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

/**
 * What a recurring item is. Subscriptions renew and charge automatically.
 * Bills (rent, utilities, insurance, loans, phone) may be autopaid or paid by hand.
 */
export type ItemKind = 'subscription' | 'bill';

/**
 * One recurring payment: a subscription or a bill. (The type keeps its original
 * name because it is used everywhere; "item" in comments means either kind.)
 */
export interface Subscription {
  id: string;
  name: string;
  kind: ItemKind;
  /** Bills only: paid automatically. Subscriptions are always treated as autopaid. */
  autopay: boolean;
  /** The amount changes from bill to bill (power, water); `price` is the usual estimate. */
  amountVaries: boolean;
  /**
   * Manual bills only: the most recent due date the user marked as paid (yyyy-mm-dd),
   * or null when none has been marked yet.
   */
  paidThrough: string | null;
  /** Amount per billing cycle in major currency units, e.g. 9.99. */
  price: number;
  /** ISO 4217 currency code, e.g. USD. */
  currency: string;
  cycle: BillingCycle;
  /** First paid bill date as a local calendar date, yyyy-mm-dd. */
  firstBillDate: string;
  categoryId: string;
  /** Hex colour used for the avatar and accents. */
  color: string;
  emoji: string;
  notes: string;
  /** Days before a renewal to notify, or null for no reminder. */
  reminderDaysBefore: number | null;
  status: SubscriptionStatus;
  /** Free-trial end date (yyyy-mm-dd) or null when there is no trial. */
  trialEndDate: string | null;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}

export type SubscriptionDraft = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  builtIn: boolean;
}

export type ThemePreference = 'system' | 'light' | 'dark';
export type SummaryPeriod = 'month' | 'year';
export type SortKey = 'nextBill' | 'name' | 'priceDesc' | 'priceAsc';

export interface Settings {
  currency: string;
  theme: ThemePreference;
  /** Local hour of day (0-23) at which reminders fire. */
  reminderHour: number;
  notificationsEnabled: boolean;
  onboardingComplete: boolean;
  summaryPeriod: SummaryPeriod;
  sortBy: SortKey;
}

export interface Meta {
  installedAt: string;
  sessionCount: number;
  lastReviewPromptAt: string | null;
  reviewPromptCount: number;
  isPro: boolean;
}

/** 'bill' means a charge or due date (for either kind); 'overdue' is a manual bill past its due date. */
export type UpcomingEventType = 'bill' | 'trialEnd' | 'overdue';

export type KindFilter = 'all' | ItemKind;

export interface UpcomingEvent {
  subscription: Subscription;
  type: UpcomingEventType;
  date: Date;
  daysUntil: number;
}
