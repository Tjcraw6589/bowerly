import { Platform } from 'react-native';

import { admobBannerUnitId, IS_EXPO_GO } from '@/config/monetization';

import { createStatusStore } from './statusStore';

export type AdsStatus = 'idle' | 'initializing' | 'ready' | 'disabled';

type AdsModule = typeof import('react-native-google-mobile-ads');

const status = createStatusStore<AdsStatus>('idle');
export const useAdsStatus = status.use;
export const getAdsStatus = status.get;

let adsModule: AdsModule | null | undefined;

/** Loads the native module lazily so Expo Go and test runs never touch it. */
export function loadAdsModule(): AdsModule | null {
  if (adsModule !== undefined) return adsModule;
  if (IS_EXPO_GO) {
    adsModule = null;
    return adsModule;
  }
  try {
    // A static import would evaluate the native module at startup and crash Expo Go; the require stays lazy on purpose.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    adsModule = require('react-native-google-mobile-ads') as AdsModule;
  } catch {
    adsModule = null;
  }
  return adsModule;
}

/** The unit id to request: Google's test unit in development, the configured unit in production, or null to show nothing. */
export function bannerUnitId(): string | null {
  const mod = loadAdsModule();
  if (!mod) return null;
  if (__DEV__) return mod.TestIds.ADAPTIVE_BANNER;
  return admobBannerUnitId();
}

async function requestTrackingIfNeeded(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const tracking = await import('expo-tracking-transparency');
    const current = await tracking.getTrackingPermissionsAsync();
    if (current.status === tracking.PermissionStatus.UNDETERMINED) {
      await tracking.requestTrackingPermissionsAsync();
    }
  } catch {
    // Tracking permission is optional; ads still load as non-personalised.
  }
}

let initPromise: Promise<void> | null = null;

/**
 * Gathers UMP consent (shown only where required), asks for iOS tracking
 * permission once, then starts the Mobile Ads SDK. Never throws, never blocks
 * the UI: screens render immediately and the banner appears when ready.
 */
export function initializeAds(isPro: boolean): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const mod = loadAdsModule();
    if (!mod || isPro || bannerUnitId() === null) {
      status.set('disabled');
      return;
    }
    status.set('initializing');
    try {
      try {
        await mod.AdsConsent.gatherConsent();
      } catch {
        // Consent errors are not fatal; the SDK may still serve ads where allowed.
      }
      const { canRequestAds } = await mod.AdsConsent.getConsentInfo();
      if (!canRequestAds) {
        status.set('disabled');
        return;
      }
      await requestTrackingIfNeeded();
      await mod.default().setRequestConfiguration({ maxAdContentRating: mod.MaxAdContentRating.PG });
      await mod.default().initialize();
      status.set('ready');
    } catch {
      status.set('disabled');
    }
  })();
  return initPromise;
}

export const adsSupported = true;
