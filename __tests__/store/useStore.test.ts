import { OTHER_CATEGORY_ID } from '@/lib/categories';
import { FREE_ACTIVE_LIMIT } from '@/lib/limits';
import type { SubscriptionDraft } from '@/lib/types';
import { useStore } from '@/store/useStore';

import { makeSub, resetStore } from '../helpers';

function draft(overrides: Partial<SubscriptionDraft> = {}): SubscriptionDraft {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = makeSub();
  return { ...rest, ...overrides };
}

beforeEach(() => resetStore({ onboardingComplete: true }));

describe('subscriptions', () => {
  test('add, update, remove', () => {
    const result = useStore.getState().addSubscription(draft({ name: '  Netflix  ', notes: ' hi ' }));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.subscription.name).toBe('Netflix');
    expect(result.subscription.notes).toBe('hi');
    expect(useStore.getState().subscriptions).toHaveLength(1);

    useStore.getState().updateSubscription(result.subscription.id, { price: 20 });
    const updated = useStore.getState().subscriptions[0];
    expect(updated?.price).toBe(20);
    expect(updated !== undefined && updated.updatedAt >= result.subscription.updatedAt).toBe(true);

    useStore.getState().removeSubscription(result.subscription.id);
    expect(useStore.getState().subscriptions).toHaveLength(0);
  });

  test('enforces the free limit on active subscriptions only', () => {
    const store = useStore.getState();
    for (let i = 0; i < FREE_ACTIVE_LIMIT; i++) expect(store.addSubscription(draft()).ok).toBe(true);
    expect(store.addSubscription(draft())).toEqual({ ok: false, reason: 'limit' });
    expect(store.addSubscription(draft({ status: 'paused' })).ok).toBe(true);
    expect(useStore.getState().subscriptions).toHaveLength(FREE_ACTIVE_LIMIT + 1);

    useStore.getState().setPro(true);
    expect(useStore.getState().addSubscription(draft()).ok).toBe(true);
  });

  test('status changes stamp cancellation and respect the limit on reactivation', () => {
    const store = useStore.getState();
    const added = store.addSubscription(draft());
    if (!added.ok) throw new Error('unreachable');
    store.setSubscriptionStatus(added.subscription.id, 'cancelled');
    const cancelled = useStore.getState().subscriptions[0]!;
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelledAt).not.toBeNull();

    for (let i = 0; i < FREE_ACTIVE_LIMIT; i++) store.addSubscription(draft());
    expect(useStore.getState().setSubscriptionStatus(added.subscription.id, 'active')).toEqual({ ok: false, reason: 'limit' });
    useStore.getState().setSubscriptionStatus(added.subscription.id, 'paused');
    expect(useStore.getState().subscriptions[0]?.status).toBe('paused');
    expect(useStore.getState().subscriptions[0]?.cancelledAt).toBeNull();
  });
});

describe('categories', () => {
  test('custom categories can be added, edited and removed; built-ins cannot be removed', () => {
    const store = useStore.getState();
    const cat = store.addCategory({ name: ' Pets ', emoji: '🐾', color: '#000000' });
    expect(cat.name).toBe('Pets');
    expect(cat.builtIn).toBe(false);
    store.updateCategory(cat.id, { name: 'Animals' });
    expect(useStore.getState().categories.find((c) => c.id === cat.id)?.name).toBe('Animals');

    const sub = store.addSubscription(draft({ categoryId: cat.id }));
    if (!sub.ok) throw new Error('unreachable');
    store.removeCategory(cat.id);
    expect(useStore.getState().categories.some((c) => c.id === cat.id)).toBe(false);
    expect(useStore.getState().subscriptions[0]?.categoryId).toBe(OTHER_CATEGORY_ID);

    const before = useStore.getState().categories.length;
    store.removeCategory('cat_music');
    expect(useStore.getState().categories.length).toBe(before);
  });
});

describe('settings and meta', () => {
  test('settings merge, onboarding completes, sessions and review prompts are counted', () => {
    const store = useStore.getState();
    store.updateSettings({ currency: 'EUR', reminderHour: 20 });
    expect(useStore.getState().settings).toMatchObject({ currency: 'EUR', reminderHour: 20, theme: 'system' });
    resetStore();
    expect(useStore.getState().settings.onboardingComplete).toBe(false);
    useStore.getState().completeOnboarding();
    expect(useStore.getState().settings.onboardingComplete).toBe(true);
    useStore.getState().recordSession();
    useStore.getState().recordSession();
    expect(useStore.getState().meta.sessionCount).toBe(2);
    const when = new Date(2026, 9, 22);
    useStore.getState().recordReviewPrompt(when);
    expect(useStore.getState().meta.lastReviewPromptAt).toBe(when.toISOString());
    expect(useStore.getState().meta.reviewPromptCount).toBe(1);
  });
});

describe('import and reset', () => {
  test('import adds categories and skips active rows beyond the free limit', () => {
    const store = useStore.getState();
    const cat = { id: 'imported-cat', name: 'Imported', emoji: '🏷️', color: '#111111', builtIn: false };
    const drafts = Array.from({ length: FREE_ACTIVE_LIMIT + 2 }, (_, i) => draft({ categoryId: cat.id, status: i === 0 ? 'paused' : 'active' }));
    const summary = store.importSubscriptions(drafts, [cat]);
    expect(summary).toEqual({ imported: FREE_ACTIVE_LIMIT + 1, skippedForLimit: 1 });
    expect(useStore.getState().categories.some((c) => c.id === cat.id)).toBe(true);
    store.importSubscriptions([], [cat]);
    expect(useStore.getState().categories.filter((c) => c.id === cat.id)).toHaveLength(1);
  });

  test('resetAll clears data but keeps settings and Pro', () => {
    const store = useStore.getState();
    store.setPro(true);
    store.updateSettings({ currency: 'GBP' });
    store.addSubscription(draft());
    store.addCategory({ name: 'X', emoji: 'x', color: '#000' });
    store.resetAll();
    const state = useStore.getState();
    expect(state.subscriptions).toEqual([]);
    expect(state.categories.every((c) => c.builtIn)).toBe(true);
    expect(state.settings.currency).toBe('GBP');
    expect(state.meta.isPro).toBe(true);
  });
});
