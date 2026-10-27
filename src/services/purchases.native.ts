import { Platform } from 'react-native';

import { IS_EXPO_GO, PRO_ENTITLEMENT, PRO_PRODUCT_ID, revenueCatApiKey } from '@/config/monetization';

import { createStatusStore } from './statusStore';

export type StoreStatus = 'unconfigured' | 'loading' | 'ready' | 'unavailable';

export interface ProOffer {
  priceString: string;
  productId: string;
  title: string;
}

export type PurchaseOutcome = 'purchased' | 'cancelled' | 'failed';
export type RestoreOutcome = 'restored' | 'none' | 'failed';

type PurchasesModule = typeof import('react-native-purchases');
type CustomerInfo = import('react-native-purchases').CustomerInfo;
type PurchasesPackage = import('react-native-purchases').PurchasesPackage;

const status = createStatusStore<StoreStatus>('unconfigured');
export const usePurchasesStatus = status.use;
export const getPurchasesStatus = status.get;

let purchasesModule: PurchasesModule | null | undefined;
let configured = false;
let cachedPackage: PurchasesPackage | null = null;

function loadModule(): PurchasesModule | null {
  if (purchasesModule !== undefined) return purchasesModule;
  if (IS_EXPO_GO) {
    purchasesModule = null;
    return purchasesModule;
  }
  try {
    // Lazy on purpose: a static import evaluates the native billing module at startup and crashes Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    purchasesModule = require('react-native-purchases') as PurchasesModule;
  } catch {
    purchasesModule = null;
  }
  return purchasesModule;
}

export function hasProEntitlement(info: CustomerInfo): boolean {
  return typeof info.entitlements.active[PRO_ENTITLEMENT] !== 'undefined';
}

/**
 * Configures RevenueCat once and reports entitlement changes. Without an API key
 * (fresh clone, Expo Go, web preview) the store is marked unavailable and the
 * Pro screen explains that instead of failing.
 */
export async function configurePurchases(onProChange: (isPro: boolean) => void): Promise<void> {
  if (configured) return;
  const mod = loadModule();
  const apiKey = revenueCatApiKey();
  if (!mod || !apiKey) {
    status.set('unavailable');
    return;
  }
  configured = true;
  status.set('loading');
  try {
    const Purchases = mod.default;
    Purchases.setLogLevel(__DEV__ ? mod.LOG_LEVEL.WARN : mod.LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey });
    Purchases.addCustomerInfoUpdateListener((info) => onProChange(hasProEntitlement(info)));
    const info = await Purchases.getCustomerInfo();
    onProChange(hasProEntitlement(info));
    status.set('ready');
  } catch {
    status.set('unavailable');
  }
}

function pickProPackage(offerings: import('react-native-purchases').PurchasesOfferings): PurchasesPackage | null {
  const current = offerings.current;
  const candidates = current ? current.availablePackages : Object.values(offerings.all).flatMap((o) => o.availablePackages);
  return candidates.find((p) => p.product.identifier === PRO_PRODUCT_ID) ?? current?.lifetime ?? candidates[0] ?? null;
}

export async function fetchProOffer(): Promise<ProOffer | null> {
  const mod = loadModule();
  if (!mod || status.get() !== 'ready') return null;
  try {
    const offerings = await mod.default.getOfferings();
    const pkg = pickProPackage(offerings);
    cachedPackage = pkg;
    if (!pkg) return null;
    return { priceString: pkg.product.priceString, productId: pkg.product.identifier, title: pkg.product.title };
  } catch {
    return null;
  }
}

function isUserCancelled(error: unknown, mod: PurchasesModule): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { userCancelled?: boolean | null; code?: string };
  return e.userCancelled === true || e.code === mod.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export async function purchasePro(): Promise<PurchaseOutcome> {
  const mod = loadModule();
  if (!mod || status.get() !== 'ready') return 'failed';
  try {
    if (!cachedPackage) await fetchProOffer();
    if (!cachedPackage) return 'failed';
    const { customerInfo } = await mod.default.purchasePackage(cachedPackage);
    return hasProEntitlement(customerInfo) ? 'purchased' : 'failed';
  } catch (error) {
    return isUserCancelled(error, mod) ? 'cancelled' : 'failed';
  }
}

export async function restorePro(): Promise<RestoreOutcome> {
  const mod = loadModule();
  if (!mod || status.get() !== 'ready') return 'failed';
  try {
    const info = await mod.default.restorePurchases();
    return hasProEntitlement(info) ? 'restored' : 'none';
  } catch {
    return 'failed';
  }
}

export const purchasesSupported = true;

/** The store that bills this install, named the way the user knows it. */
export function billingStoreName(): string {
  return Platform.OS === 'android' ? 'Google Play' : 'Apple';
}

/** What the user signs in with to restore purchases on another device. */
export function storeAccountName(): string {
  return Platform.OS === 'android' ? 'Google account' : 'Apple Account';
}
