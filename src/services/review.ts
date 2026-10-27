import * as StoreReview from 'expo-store-review';

import { shouldRequestReview } from '@/lib/review';
import { selectActiveCount, useStore } from '@/store/useStore';

let inFlight = false;

/**
 * Asks for a store rating only after a satisfying moment and only when the
 * gate in lib/review says the user has had enough good sessions. Returns true
 * when the native prompt was requested.
 */
export async function maybeRequestReview(afterPositiveAction: boolean, now = new Date()): Promise<boolean> {
  if (inFlight) return false;
  const state = useStore.getState();
  const ok = shouldRequestReview({
    meta: state.meta,
    activeCount: selectActiveCount(state),
    now,
    afterPositiveAction,
  });
  if (!ok) return false;
  inFlight = true;
  try {
    if (!(await StoreReview.isAvailableAsync())) return false;
    if (!(await StoreReview.hasAction())) return false;
    await StoreReview.requestReview();
    useStore.getState().recordReviewPrompt(now);
    return true;
  } catch {
    return false;
  } finally {
    inFlight = false;
  }
}

/** Opens the store page for a manual "Rate Billnest" row in settings. */
export function storePageUrl(): string | null {
  try {
    return StoreReview.storeUrl();
  } catch {
    return null;
  }
}
