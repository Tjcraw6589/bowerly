import { monthlyCost } from './money';
import { nextEvent } from './stats';
import type { KindFilter, SortKey, Subscription } from './types';

export const SORT_OPTIONS: readonly { key: SortKey; label: string }[] = [
  { key: 'nextBill', label: 'Next due' },
  { key: 'name', label: 'Name' },
  { key: 'priceDesc', label: 'Price: high to low' },
  { key: 'priceAsc', label: 'Price: low to high' },
];

/** Active first (soonest renewal first within), then paused, then cancelled. */
export function sortSubscriptions(subs: readonly Subscription[], key: SortKey, today: Date): Subscription[] {
  const statusRank = { active: 0, paused: 1, cancelled: 2 } as const;
  const nextTime = new Map<string, number>();
  for (const s of subs) {
    const e = nextEvent(s, today);
    nextTime.set(s.id, e ? e.date.getTime() : Number.MAX_SAFE_INTEGER);
  }
  return [...subs].sort((a, b) => {
    const rank = statusRank[a.status] - statusRank[b.status];
    if (rank !== 0) return rank;
    switch (key) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'priceDesc':
        return monthlyCost(b.price, b.cycle) - monthlyCost(a.price, a.cycle) || a.name.localeCompare(b.name);
      case 'priceAsc':
        return monthlyCost(a.price, a.cycle) - monthlyCost(b.price, b.cycle) || a.name.localeCompare(b.name);
      case 'nextBill':
      default:
        return (nextTime.get(a.id) ?? 0) - (nextTime.get(b.id) ?? 0) || a.name.localeCompare(b.name);
    }
  });
}

export function filterSubscriptions(
  subs: readonly Subscription[],
  query: string,
  categoryId: string | null,
  kind: KindFilter = 'all',
): Subscription[] {
  const q = query.trim().toLowerCase();
  return subs.filter((s) => {
    if (kind !== 'all' && s.kind !== kind) return false;
    if (categoryId && s.categoryId !== categoryId) return false;
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.notes.toLowerCase().includes(q);
  });
}
