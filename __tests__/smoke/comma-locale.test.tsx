import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { useStore } from '@/store/useStore';

import { makeSub, resetStore } from '../helpers';

// A German phone: commas are decimals, dots group thousands.
jest.mock('expo-localization', () => ({
  getLocales: () => [
    {
      languageTag: 'de-DE',
      languageCode: 'de',
      regionCode: 'DE',
      currencyCode: 'EUR',
      currencySymbol: '€',
      decimalSeparator: ',',
      digitGroupingSeparator: '.',
      textDirection: 'ltr',
      measurementSystem: 'metric',
      temperatureUnit: 'celsius',
    },
  ],
  getCalendars: () => [{ calendar: 'gregory', firstWeekday: 2, timeZone: 'UTC', uses24hourClock: true }],
}));

jest.setTimeout(30_000);

describe('editing on a comma-decimal phone', () => {
  beforeEach(() => resetStore({ onboardingComplete: true }));

  test('opening a bill and saving without changes keeps its price (no 100x jump)', async () => {
    const sub = makeSub({ name: 'Strom', kind: 'bill', autopay: false, price: 9.99, currency: 'EUR' });
    useStore.setState({ subscriptions: [sub] });
    await renderRouter('./src/app', { initialUrl: `/editor?id=${sub.id}` });
    await screen.findByTestId('editor-screen');
    // Pre-filled the way a German user writes it.
    expect(screen.getByTestId('price-field').props.value).toBe('9,99');
    await act(async () => {
      fireEvent.press(screen.getByTestId('editor-save'));
    });
    expect(useStore.getState().subscriptions[0]?.price).toBe(9.99);
  });

  test('typing thousands with dots still means thousands', async () => {
    const sub = makeSub({ name: 'Miete', kind: 'bill', autopay: false, price: 900, currency: 'EUR' });
    useStore.setState({ subscriptions: [sub] });
    await renderRouter('./src/app', { initialUrl: `/editor?id=${sub.id}` });
    await screen.findByTestId('editor-screen');
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('price-field'), '1.250');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('editor-save'));
    });
    expect(useStore.getState().subscriptions[0]?.price).toBe(1250);
  });
});
