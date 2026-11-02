// Randomized checks of the date and payment rules. A fixed seed keeps runs repeatable;
// each case prints its inputs on failure so a bug can be turned into a plain test.
import { addDays, nextBillIndex, nthBillDate, parseISODate, startOfDay, toISODate } from '@/lib/dates';
import { nextUnpaidDue, overdueDates, paidThroughAfterMarking, paidThroughAfterUndo } from '@/lib/payments';
import type { BillingCycle, CycleUnit, Subscription } from '@/lib/types';

import { makeSub } from '../helpers';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const UNITS: CycleUnit[] = ['day', 'week', 'month', 'year'];

function randomCase(r: () => number) {
  const unit = UNITS[Math.floor(r() * UNITS.length)]!;
  const every = unit === 'day' ? 1 + Math.floor(r() * 45) : unit === 'week' ? 1 + Math.floor(r() * 6) : unit === 'month' ? 1 + Math.floor(r() * 13) : 1 + Math.floor(r() * 2);
  const cycle: BillingCycle = { every, unit };
  // Days 28 to 31 on purpose: month end clamping is where date bugs live.
  const day = r() < 0.5 ? 28 + Math.floor(r() * 4) : 1 + Math.floor(r() * 28);
  const first = new Date(2023 + Math.floor(r() * 4), Math.floor(r() * 12), 1);
  first.setDate(Math.min(day, new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()));
  const created = addDays(first, Math.floor(r() * 400) - 100);
  const today = addDays(created, Math.floor(r() * 500));
  return { cycle, first, created, today };
}

const CASES = 4000;

describe('date rules hold for thousands of random schedules', () => {
  it('nextBillIndex finds the first due date on or after today', () => {
    const r = rng(20261102);
    for (let i = 0; i < CASES; i++) {
      const { cycle, first, today } = randomCase(r);
      const n = nextBillIndex(first, cycle, today);
      const ctx = JSON.stringify({ cycle, first: toISODate(first), today: toISODate(today), n });
      expect([ctx, nthBillDate(first, cycle, n).getTime() >= startOfDay(today).getTime()]).toEqual([ctx, true]);
      if (n > 0) expect([ctx, nthBillDate(first, cycle, n - 1).getTime() < startOfDay(today).getTime()]).toEqual([ctx, true]);
    }
  });

  it('due dates never go backwards or repeat', () => {
    const r = rng(7);
    for (let i = 0; i < 500; i++) {
      const { cycle, first } = randomCase(r);
      let prev = -Infinity;
      for (let n = 0; n < 40; n++) {
        const t = nthBillDate(first, cycle, n).getTime();
        expect(t).toBeGreaterThan(prev);
        prev = t;
      }
    }
  });
});

describe('mark paid and undo, random hand paid bills', () => {
  function bill(c: ReturnType<typeof randomCase>, paidThrough: string | null): Subscription {
    return makeSub({
      kind: 'bill',
      autopay: false,
      cycle: c.cycle,
      firstBillDate: toISODate(c.first),
      createdAt: c.created.toISOString(),
      paidThrough,
    });
  }

  it('marking paid always moves forward, and undo puts it back', () => {
    const r = rng(42);
    for (let i = 0; i < CASES; i++) {
      const c = randomCase(r);
      let sub = bill(c, null);
      const history: (string | null)[] = [null];
      const marks = 1 + Math.floor(r() * 5);
      for (let k = 0; k < marks; k++) {
        const before = nextUnpaidDue(sub, c.today)!;
        const paid = paidThroughAfterMarking(sub, c.today);
        sub = { ...sub, paidThrough: paid };
        history.push(paid);
        const after = nextUnpaidDue(sub, c.today)!;
        const ctx = JSON.stringify({ cycle: c.cycle, first: toISODate(c.first), created: toISODate(c.created), today: toISODate(c.today), paid });
        expect([ctx, after.getTime() > before.getTime()]).toEqual([ctx, true]);
        // Overdue dates are in the past, oldest first, and after anything paid.
        const overdue = overdueDates(sub, c.today);
        for (let j = 0; j < overdue.length; j++) {
          expect(overdue[j]!.getTime()).toBeLessThan(startOfDay(c.today).getTime());
          if (paid) expect(overdue[j]!.getTime()).toBeGreaterThan(parseISODate(paid)!.getTime());
          if (j > 0) expect(overdue[j]!.getTime()).toBeGreaterThan(overdue[j - 1]!.getTime());
        }
      }
      // Undo walks back through exactly the same states, down to "not yet" or the first tracked date.
      for (let k = history.length - 1; k > 0; k--) {
        const undone = paidThroughAfterUndo(sub);
        const ctx = JSON.stringify({ cycle: c.cycle, first: toISODate(c.first), created: toISODate(c.created), from: sub.paidThrough, expected: history[k - 1], undone });
        const expected = history[k - 1] ?? null;
        expect([ctx, undone]).toEqual([ctx, expected]);
        sub = { ...sub, paidThrough: undone };
        if (undone === null) break;
      }
    }
  });

  it('undo always changes what counts as paid, even after the due date was edited', () => {
    const r = rng(99);
    for (let i = 0; i < CASES; i++) {
      const c = randomCase(r);
      // A paid through date that is not a due date: what is left after editing the schedule.
      const paidThrough = toISODate(addDays(c.today, -Math.floor(r() * 60)));
      const sub = bill(c, paidThrough);
      const undone = paidThroughAfterUndo(sub);
      const covered = (s: Subscription) => {
        // Count tracked due dates on or before paidThrough.
        if (!s.paidThrough) return 0;
        const p = parseISODate(s.paidThrough)!;
        let n = 0;
        for (let k = 0; k < 2000; k++) {
          const d = nthBillDate(c.first, c.cycle, k);
          if (d.getTime() > p.getTime()) break;
          if (d.getTime() >= startOfDay(c.created).getTime()) n++;
        }
        return n;
      };
      const ctx = JSON.stringify({ cycle: c.cycle, first: toISODate(c.first), created: toISODate(c.created), paidThrough, undone });
      if (covered(sub) > 0) expect([ctx, covered({ ...sub, paidThrough: undone })]).toEqual([ctx, covered(sub) - 1]);
    }
  });
});

describe('CSV export and import, random items', () => {
  const PIECES = ['Netflix', 'Rent', ',', '"', "'", '\n', 'Café', '日本', '🎬', '=SUM(A1)', ' ', ';', 'x'];
  const pick = <T,>(r: () => number, list: readonly T[]): T => list[Math.floor(r() * list.length)]!;
  function text(r: () => number, max: number): string {
    let s = '';
    const n = 1 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) s += pick(r, PIECES);
    s = s.trim().slice(0, max).trim();
    return s || 'Item';
  }

  it('every field the app can save survives a round trip', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { subscriptionsToCSV, parseSubscriptionsCSV } = require('@/lib/csv') as typeof import('@/lib/csv');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BUILT_IN_CATEGORIES } = require('@/lib/categories') as typeof import('@/lib/categories');
    const r = rng(314);
    for (let round = 0; round < 200; round++) {
      const subs: Subscription[] = [];
      for (let i = 0; i < 5; i++) {
        const c = randomCase(r);
        const kind = r() < 0.5 ? 'bill' : 'subscription';
        const autopay = kind === 'subscription' ? true : r() < 0.5;
        const trial = kind === 'subscription' && r() < 0.3;
        subs.push(
          makeSub({
            name: text(r, 60),
            notes: r() < 0.5 ? '' : text(r, 500),
            kind,
            autopay,
            amountVaries: r() < 0.3,
            paidThrough: kind === 'bill' && !autopay && r() < 0.5 ? toISODate(c.first) : null,
            price: Math.round(r() * 500000) / 100,
            cycle: c.cycle,
            firstBillDate: toISODate(trial ? addDays(c.first, 31) : c.first),
            trialEndDate: trial ? toISODate(addDays(c.first, 30)) : null,
            categoryId: pick(r, BUILT_IN_CATEGORIES).id,
            reminderDaysBefore: r() < 0.2 ? null : Math.floor(r() * 31),
            status: pick(r, ['active', 'paused', 'cancelled'] as const),
            currency: pick(r, ['USD', 'EUR', 'JPY', 'GBP']),
          }),
        );
      }
      const csv = subscriptionsToCSV(subs, BUILT_IN_CATEGORIES);
      const result = parseSubscriptionsCSV(csv, BUILT_IN_CATEGORIES, { currency: 'USD', today: new Date(2026, 9, 22), newCategoryId: () => 'new' });
      expect([csv, result.errors]).toEqual([csv, []]);
      expect(result.drafts).toHaveLength(subs.length);
      subs.forEach((s, i) => {
        const d = result.drafts[i]!;
        const pickFields = (x: Partial<Subscription>) => ({
          name: x.name,
          notes: x.notes,
          kind: x.kind,
          autopay: x.autopay,
          amountVaries: x.amountVaries,
          paidThrough: x.paidThrough,
          price: x.price,
          cycle: x.cycle,
          firstBillDate: x.firstBillDate,
          trialEndDate: x.trialEndDate,
          categoryId: x.categoryId,
          reminderDaysBefore: x.reminderDaysBefore,
          status: x.status,
          currency: x.currency,
        });
        expect(pickFields(d)).toEqual(pickFields(s));
      });
    }
  });
});
