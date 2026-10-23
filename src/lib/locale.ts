import { getLocales } from 'expo-localization';

import { DEFAULT_CURRENCY, isKnownCurrency } from './currencies';

export interface DeviceLocale {
  languageTag: string;
  currency: string;
  decimalSeparator: '.' | ',' | undefined;
}

/** Reads the device locale once; safe to call anywhere, falls back to en-US / USD. */
export function detectDeviceLocale(): DeviceLocale {
  try {
    const first = getLocales()[0];
    const currency = first?.currencyCode && isKnownCurrency(first.currencyCode) ? first.currencyCode : DEFAULT_CURRENCY;
    const sep = first?.decimalSeparator;
    return {
      languageTag: first?.languageTag ?? 'en-US',
      currency,
      decimalSeparator: sep === ',' ? ',' : sep === '.' ? '.' : undefined,
    };
  } catch {
    return { languageTag: 'en-US', currency: DEFAULT_CURRENCY, decimalSeparator: undefined };
  }
}
