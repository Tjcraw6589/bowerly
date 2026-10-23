import { REVIEW_COOLDOWN_DAYS, shouldRequestReview } from '@/lib/review';
import type { Meta } from '@/lib/types';

const now = new Date(2026, 9, 22, 12);
const happyMeta: Meta = {
  installedAt: new Date(2026, 9, 1).toISOString(),
  sessionCount: 6,
  lastReviewPromptAt: null,
  reviewPromptCount: 0,
  isPro: false,
};
const base = { meta: happyMeta, activeCount: 4, now, afterPositiveAction: true };

describe('shouldRequestReview', () => {
  test('asks after a good session', () => {
    expect(shouldRequestReview(base)).toBe(true);
  });

  test('never asks without a positive action (e.g. not from a button or during navigation)', () => {
    expect(shouldRequestReview({ ...base, afterPositiveAction: false })).toBe(false);
  });

  test('waits for enough installed days, sessions and subscriptions', () => {
    expect(shouldRequestReview({ ...base, meta: { ...happyMeta, installedAt: new Date(2026, 9, 21).toISOString() } })).toBe(false);
    expect(shouldRequestReview({ ...base, meta: { ...happyMeta, sessionCount: 3 } })).toBe(false);
    expect(shouldRequestReview({ ...base, activeCount: 2 })).toBe(false);
  });

  test('respects the cooldown and the lifetime cap', () => {
    const recent = new Date(now.getTime() - (REVIEW_COOLDOWN_DAYS - 1) * 86_400_000).toISOString();
    const old = new Date(now.getTime() - (REVIEW_COOLDOWN_DAYS + 1) * 86_400_000).toISOString();
    expect(shouldRequestReview({ ...base, meta: { ...happyMeta, lastReviewPromptAt: recent, reviewPromptCount: 1 } })).toBe(false);
    expect(shouldRequestReview({ ...base, meta: { ...happyMeta, lastReviewPromptAt: old, reviewPromptCount: 1 } })).toBe(true);
    expect(shouldRequestReview({ ...base, meta: { ...happyMeta, lastReviewPromptAt: old, reviewPromptCount: 3 } })).toBe(false);
  });

  test('tolerates a corrupt install date', () => {
    expect(shouldRequestReview({ ...base, meta: { ...happyMeta, installedAt: 'garbage' } })).toBe(false);
  });
});
