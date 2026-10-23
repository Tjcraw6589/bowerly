import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

interface MonetizationExtra {
  admobBannerAndroid?: string;
  admobBannerIos?: string;
  revenueCatAndroid?: string;
  revenueCatIos?: string;
  proEntitlement?: string;
  proProductId?: string;
}

interface SupportExtra {
  email?: string;
  privacyUrl?: string;
  termsUrl?: string;
}

function extra<T>(key: string): T {
  const all = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  return (all[key] ?? {}) as T;
}

const monetization = extra<MonetizationExtra>('monetization');
const support = extra<SupportExtra>('support');

export const PRO_ENTITLEMENT = monetization.proEntitlement || 'pro';
export const PRO_PRODUCT_ID = monetization.proProductId || 'subtally_pro_lifetime';

export const SUPPORT_EMAIL = support.email || 'support@example.com';
export const PRIVACY_URL = support.privacyUrl || '';
export const TERMS_URL = support.termsUrl || '';

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** True inside the Expo Go sandbox, where native ad and billing modules do not exist. */
export const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function admobBannerUnitId(): string | null {
  const id = Platform.select({ android: monetization.admobBannerAndroid, ios: monetization.admobBannerIos }) ?? '';
  return id.trim().length > 0 ? id.trim() : null;
}

export function revenueCatApiKey(): string | null {
  const key = Platform.select({ android: monetization.revenueCatAndroid, ios: monetization.revenueCatIos }) ?? '';
  return key.trim().length > 0 ? key.trim() : null;
}
