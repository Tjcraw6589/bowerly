import { createStatusStore } from './statusStore';

export type StoreStatus = 'unconfigured' | 'loading' | 'ready' | 'unavailable';

export interface ProOffer {
  priceString: string;
  productId: string;
  title: string;
}

export type PurchaseOutcome = 'purchased' | 'cancelled' | 'failed';
export type RestoreOutcome = 'restored' | 'none' | 'failed';

/**
 * Store screenshots are rendered from the web build. The screenshot script sets this
 * global (it is never set in the shipped apps or the normal web preview) so the Pro
 * screen is captured in the same "ready to buy" state an iPhone user sees, showing the
 * real App Store price, instead of the web-only "store unavailable" notice.
 */
interface StorePreview {
  priceString: string;
  /** Which store's wording to show; set per screenshot set. */
  store?: 'apple' | 'google';
}

function storePreview(): StorePreview | null {
  const value = (globalThis as { __BILLNEST_STORE_PREVIEW__?: StorePreview }).__BILLNEST_STORE_PREVIEW__;
  return value && typeof value.priceString === 'string' ? value : null;
}

const status = createStatusStore<StoreStatus>(storePreview() ? 'ready' : 'unavailable');
export const usePurchasesStatus = status.use;
export const getPurchasesStatus = status.get;

// In-app purchases only exist in the native store builds. The web preview shows
// the Pro screen in its "store unavailable" state.
export async function configurePurchases(_onProChange: (isPro: boolean) => void): Promise<void> {
  status.set(storePreview() ? 'ready' : 'unavailable');
}

export async function fetchProOffer(): Promise<ProOffer | null> {
  const preview = storePreview();
  return preview ? { priceString: preview.priceString, productId: 'subtally_pro_lifetime', title: 'Billnest Pro' } : null;
}

export async function purchasePro(): Promise<PurchaseOutcome> {
  return storePreview() ? 'cancelled' : 'failed';
}

export async function restorePro(): Promise<RestoreOutcome> {
  return 'failed';
}

export const purchasesSupported = false;

export function billingStoreName(): string {
  return storePreview()?.store === 'google' ? 'Google Play' : 'Apple';
}

export function storeAccountName(): string {
  return storePreview()?.store === 'google' ? 'Google account' : 'Apple Account';
}
