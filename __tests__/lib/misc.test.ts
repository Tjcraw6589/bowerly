import { BUILT_IN_CATEGORIES, findCategory } from '@/lib/categories';
import { currencyInfo, isKnownCurrency, searchCurrencies } from '@/lib/currencies';
import { newId } from '@/lib/ids';
import { canAddActiveSubscription, FREE_ACTIVE_LIMIT, remainingFreeSlots } from '@/lib/limits';
import { searchPresets, SERVICE_PRESETS } from '@/lib/presets';
import { filterSubscriptions, sortSubscriptions } from '@/lib/sort';
import { hasErrors, validateDraft } from '@/lib/validation';

import { makeSub, TODAY } from '../helpers';

describe('free tier limits', () => {
  test('free users stop at the limit, Pro never does', () => {
    expect(canAddActiveSubscription(FREE_ACTIVE_LIMIT - 1, false)).toBe(true);
    expect(canAddActiveSubscription(FREE_ACTIVE_LIMIT, false)).toBe(false);
    expect(canAddActiveSubscription(500, true)).toBe(true);
    expect(remainingFreeSlots(FREE_ACTIVE_LIMIT - 3)).toBe(3);
    expect(remainingFreeSlots(FREE_ACTIVE_LIMIT + 5)).toBe(0);
  });
});

describe('validation', () => {
  const good = { ...makeSub(), id: undefined, createdAt: undefined, updatedAt: undefined };
  const draft = () => {
    const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = good;
    return rest;
  };

  test('accepts a sound draft', () => {
    expect(hasErrors(validateDraft(draft()))).toBe(false);
  });

  test('catches each field problem', () => {
    expect(validateDraft({ ...draft(), name: '  ' }).name).toBeDefined();
    expect(validateDraft({ ...draft(), name: 'x'.repeat(61) }).name).toBeDefined();
    expect(validateDraft({ ...draft(), price: Number.NaN }).price).toBeDefined();
    expect(validateDraft({ ...draft(), price: -1 }).price).toBeDefined();
    expect(validateDraft({ ...draft(), cycle: { every: 0, unit: 'month' } }).cycleEvery).toBeDefined();
    expect(validateDraft({ ...draft(), currency: 'usd' }).currency).toBeDefined();
    expect(validateDraft({ ...draft(), firstBillDate: '2026-02-30' }).firstBillDate).toBeDefined();
    expect(validateDraft({ ...draft(), trialEndDate: 'nope' }).trialEndDate).toBeDefined();
  });

  test('requires the first paid bill to follow the trial', () => {
    const errors = validateDraft({ ...draft(), trialEndDate: '2026-11-10', firstBillDate: '2026-11-10' });
    expect(errors.firstBillDate).toContain('after the trial');
    expect(hasErrors(validateDraft({ ...draft(), trialEndDate: '2026-11-10', firstBillDate: '2026-11-11' }))).toBe(false);
  });
});

describe('sorting and filtering', () => {
  const subs = [
    makeSub({ name: 'Zed', price: 1, firstBillDate: '2026-10-30', status: 'paused' }),
    makeSub({ name: 'Beta', price: 50, firstBillDate: '2026-10-28' }),
    makeSub({ name: 'Alpha', price: 5, firstBillDate: '2026-10-23', notes: 'family plan' }),
    makeSub({ name: 'Gone', price: 9, status: 'cancelled' }),
  ];

  test('active first, then by the chosen key', () => {
    expect(sortSubscriptions(subs, 'nextBill', TODAY).map((s) => s.name)).toEqual(['Alpha', 'Beta', 'Zed', 'Gone']);
    expect(sortSubscriptions(subs, 'name', TODAY).map((s) => s.name)).toEqual(['Alpha', 'Beta', 'Zed', 'Gone']);
    expect(sortSubscriptions(subs, 'priceDesc', TODAY).map((s) => s.name)).toEqual(['Beta', 'Alpha', 'Zed', 'Gone']);
    expect(sortSubscriptions(subs, 'priceAsc', TODAY).map((s) => s.name)).toEqual(['Alpha', 'Beta', 'Zed', 'Gone']);
  });

  test('filters by text in name or notes and by category', () => {
    expect(filterSubscriptions(subs, 'family', null).map((s) => s.name)).toEqual(['Alpha']);
    expect(filterSubscriptions(subs, 'ZE', null).map((s) => s.name)).toEqual(['Zed']);
    expect(filterSubscriptions(subs, '', 'cat_music')).toEqual([]);
    expect(filterSubscriptions(subs, '', 'cat_streaming')).toHaveLength(4);
  });
});

describe('reference data', () => {
  test('presets search by prefix and word', () => {
    expect(searchPresets('net')[0]?.name).toBe('Netflix');
    expect(searchPresets('game').map((p) => p.name)).toContain('Xbox Game Pass');
    expect(searchPresets('')).toEqual([]);
    expect(searchPresets('a', 3)).toHaveLength(3);
    const ids = new Set(SERVICE_PRESETS.map((p) => p.categoryId));
    for (const id of ids) expect(BUILT_IN_CATEGORIES.some((c) => c.id === id)).toBe(true);
  });

  test('categories fall back to Other', () => {
    expect(findCategory(BUILT_IN_CATEGORIES, 'cat_music').name).toBe('Music');
    expect(findCategory(BUILT_IN_CATEGORIES, 'missing').id).toBe('cat_other');
  });

  test('currencies', () => {
    expect(isKnownCurrency('USD')).toBe(true);
    expect(isKnownCurrency('XXX')).toBe(false);
    expect(currencyInfo('EUR').symbol).toBe('€');
    expect(currencyInfo('ZZZ')).toEqual({ code: 'ZZZ', name: 'ZZZ', symbol: 'ZZZ' });
    expect(searchCurrencies('pound').map((c) => c.code)).toContain('GBP');
  });

  test('ids are unique strings', () => {
    const set = new Set(Array.from({ length: 200 }, () => newId()));
    expect(set.size).toBe(200);
  });
});
