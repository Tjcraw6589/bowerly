import { createStatusStore } from './statusStore';

export type StoreStatus = 'unconfigured' | 'loading' | 'ready' | 'unavailable';

export interface ProOffer {
  priceString: string;
  productId: string;
  title: string;
}

export type PurchaseOutcome = 'purchased' | 'cancelled' | 'failed';
export type RestoreOutcome = 'restored' | 'none' | 'failed';

const status = createStatusStore<StoreStatus>('unavailable');
export const usePurchasesStatus = status.use;
export const getPurchasesStatus = status.get;

// In-app purchases only exist in the native store builds. The web preview shows
// the Pro screen in its "store unavailable" state.
export async function configurePurchases(_onProChange: (isPro: boolean) => void): Promise<void> {
  status.set('unavailable');
}

export async function fetchProOffer(): Promise<ProOffer | null> {
  return null;
}

export async function purchasePro(): Promise<PurchaseOutcome> {
  return 'failed';
}

export async function restorePro(): Promise<RestoreOutcome> {
  return 'failed';
}

export const purchasesSupported = false;
