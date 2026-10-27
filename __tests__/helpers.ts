import { BUILT_IN_CATEGORIES } from '@/lib/categories';
import type { Subscription } from '@/lib/types';
import { createDefaultMeta, createDefaultSettings, useStore } from '@/store/useStore';

export const TODAY = new Date(2026, 9, 22); // 22 October 2026, local midnight

let counter = 0;

export function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  counter += 1;
  return {
    id: `sub-${counter}`,
    name: `Service ${counter}`,
    kind: 'subscription',
    autopay: true,
    amountVaries: false,
    paidThrough: null,
    price: 10,
    currency: 'USD',
    cycle: { every: 1, unit: 'month' },
    firstBillDate: '2026-01-15',
    categoryId: 'cat_streaming',
    color: '#E53958',
    emoji: '🎬',
    notes: '',
    reminderDaysBefore: 1,
    status: 'active',
    trialEndDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    cancelledAt: null,
    ...overrides,
  };
}

/** Puts the store back to a known state. Call in beforeEach. */
export function resetStore(partial: { onboardingComplete?: boolean; isPro?: boolean } = {}): void {
  const settings = createDefaultSettings('USD');
  settings.onboardingComplete = partial.onboardingComplete ?? false;
  const meta = createDefaultMeta(new Date(2026, 9, 1));
  meta.isPro = partial.isPro ?? false;
  useStore.setState({
    subscriptions: [],
    categories: [...BUILT_IN_CATEGORIES],
    settings,
    meta,
    hydrated: true,
  });
}
