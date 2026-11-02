import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import type { SubscriptionDraft } from '@/lib/types';
import { useStore } from '@/store/useStore';

import { resetStore } from '../helpers';

jest.setTimeout(30_000);

function draft(name: string, extra: Partial<SubscriptionDraft> = {}): SubscriptionDraft {
  return {
    name,
    kind: 'subscription',
    autopay: true,
    amountVaries: false,
    paidThrough: null,
    price: 10,
    currency: 'USD',
    cycle: { every: 1, unit: 'month' },
    firstBillDate: '2026-01-05',
    categoryId: 'cat_streaming',
    color: '#1DB954',
    emoji: '🎧',
    notes: '',
    reminderDaysBefore: 1,
    status: 'active',
    trialEndDate: null,
    cancelledAt: null,
    ...extra,
  };
}

function add(name: string, extra: Partial<SubscriptionDraft> = {}): string {
  const result = useStore.getState().addSubscription(draft(name, extra));
  if (!result.ok) throw new Error('limit');
  return result.subscription.id;
}

async function remove(id: string): Promise<void> {
  await act(async () => {
    useStore.getState().removeSubscription(id);
  });
}

/**
 * A filter whose control disappears (its chips or the search box) must stop filtering,
 * otherwise the list stays empty with nothing on screen to clear it.
 */
describe('Bills list filters never get stuck hidden', () => {
  beforeEach(() => resetStore({ onboardingComplete: true, isPro: true }));

  test('the type filter', async () => {
    add('Rent', { kind: 'bill', categoryId: 'cat_housing' });
    const netflix = add('Netflix');
    await renderRouter('./src/app', { initialUrl: '/' });
    await screen.findByTestId('kind-filter');
    await act(async () => {
      fireEvent.press(screen.getByText('🔁 Subscriptions'));
    });
    expect(screen.queryByText('Rent')).toBeNull();
    await remove(netflix);
    expect(screen.queryByTestId('kind-filter')).toBeNull();
    expect(screen.getByText('Rent')).toBeTruthy();
    await act(async () => {
      add('Water', { kind: 'bill', categoryId: 'cat_utilities' });
    });
    expect(screen.getByText('Water')).toBeTruthy();
  });

  test('the category filter', async () => {
    add('Netflix');
    const gym = add('Gym', { categoryId: 'cat_fitness' });
    await renderRouter('./src/app', { initialUrl: '/' });
    await act(async () => {
      fireEvent.press((await screen.findAllByText('💪 Health & Fitness'))[0]!);
    });
    expect(screen.queryByText('Netflix')).toBeNull();
    await remove(gym);
    expect(screen.getByText('Netflix')).toBeTruthy();
  });

  test('the search box', async () => {
    const ids = ['Netflix', 'Spotify', 'Gym', 'Rent', 'Water'].map((n) => add(n));
    await renderRouter('./src/app', { initialUrl: '/' });
    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('search-field'), 'Gym');
    });
    expect(screen.queryByText('Netflix')).toBeNull();
    // Down to four items: the search box goes away, so its text must stop filtering.
    await remove(ids[4]!);
    expect(screen.queryByTestId('search-field')).toBeNull();
    for (const name of ['Netflix', 'Spotify', 'Gym', 'Rent']) expect(screen.getByText(name)).toBeTruthy();
  });
});
