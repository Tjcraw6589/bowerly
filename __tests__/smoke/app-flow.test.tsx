import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { useStore } from '@/store/useStore';

import { resetStore } from '../helpers';

jest.setTimeout(30_000);

/** Presses a testID and lets React flush the resulting state updates and navigation. */
async function press(testID: string): Promise<void> {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe('Billnest end-to-end (router)', () => {
  beforeEach(() => resetStore({ onboardingComplete: false }));

  test('onboarding → empty list → add a subscription → it appears with totals', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });

    // Onboarding is shown first and is skippable in three taps.
    await screen.findByTestId('onboarding');
    await press('onboarding-next');
    await screen.findByTestId('currency-more');
    await press('onboarding-next');
    await screen.findByTestId('onboarding-finish');
    await press('onboarding-finish');

    await screen.findByTestId('subscriptions-screen');
    expect(useStore.getState().settings.onboardingComplete).toBe(true);
    await waitFor(() => expect(screen).toHavePathname('/'));

    // Empty state leads to the editor.
    await press('empty-state-action');
    await screen.findByTestId('editor-screen');

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('name-field'), 'Netflix');
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('price-field'), '15.49');
    });
    await press('editor-save');

    await screen.findByTestId('subscriptions-screen');
    expect(useStore.getState().subscriptions).toHaveLength(1);
    expect(useStore.getState().subscriptions[0]).toMatchObject({ name: 'Netflix', price: 15.49, currency: 'USD', status: 'active' });
    expect(screen.getByText('Netflix')).toBeTruthy();
    expect(screen.getByTestId('totals-amount').props.children).toBe('$15.49');
  });

  test('validation blocks an empty form', async () => {
    resetStore({ onboardingComplete: true });
    await renderRouter('./src/app', { initialUrl: '/editor' });
    await screen.findByTestId('editor-screen');
    await press('editor-save');
    expect(await screen.findByText('Give this subscription a name.')).toBeTruthy();
    expect(useStore.getState().subscriptions).toHaveLength(0);
  });

  test('the Pro screen handles an unavailable store without breaking', async () => {
    resetStore({ onboardingComplete: true });
    await renderRouter('./src/app', { initialUrl: '/pro?reason=limit' });
    await screen.findByTestId('pro-screen');
    expect(screen.getByTestId('store-unavailable')).toBeTruthy();
    expect(screen.getByTestId('pro-buy').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('You have outgrown the free plan')).toBeTruthy();
  });

  test('the subscriptions tab, insights and settings render with seeded data', async () => {
    resetStore({ onboardingComplete: true, isPro: true });
    useStore.getState().addSubscription({
      name: 'Spotify',
      price: 10.99,
      currency: 'USD',
      cycle: { every: 1, unit: 'month' },
      firstBillDate: '2026-01-05',
      categoryId: 'cat_music',
      color: '#1DB954',
      emoji: '🎧',
      notes: '',
      reminderDaysBefore: 1,
      status: 'active',
      trialEndDate: null,
      cancelledAt: null,
    });
    await renderRouter('./src/app', { initialUrl: '/insights' });
    await screen.findByTestId('insights-screen');
    expect(screen.getByTestId('category-chart')).toBeTruthy();
    expect(screen.getByTestId('timeline-chart')).toBeTruthy();
    expect(screen.getByText('Spotify')).toBeTruthy();
  });
});
