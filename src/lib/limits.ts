export const FREE_ACTIVE_LIMIT = 10;

export function canAddActiveSubscription(activeCount: number, isPro: boolean): boolean {
  return isPro || activeCount < FREE_ACTIVE_LIMIT;
}

export function remainingFreeSlots(activeCount: number): number {
  return Math.max(0, FREE_ACTIVE_LIMIT - activeCount);
}
