import {
  addDays,
  addMonths,
  billDatesInRange,
  billsOnOrBefore,
  daysBetween,
  daysUntil,
  isValidISODate,
  nextBillDate,
  nextBillIndex,
  nthBillDate,
  parseISODate,
  relativeDayLabel,
  toISODate,
  upcomingBillDates,
} from '@/lib/dates';
import type { BillingCycle } from '@/lib/types';

const d = (s: string): Date => {
  const parsed = parseISODate(s);
  if (!parsed) throw new Error(`bad test date ${s}`);
  return parsed;
};
const monthly: BillingCycle = { every: 1, unit: 'month' };
const weekly: BillingCycle = { every: 1, unit: 'week' };
const yearly: BillingCycle = { every: 1, unit: 'year' };

describe('ISO dates', () => {
  test('round-trips local calendar dates', () => {
    expect(toISODate(new Date(2026, 9, 22))).toBe('2026-10-22');
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(d('2026-10-22'))).toBe('2026-10-22');
  });

  test('rejects impossible dates', () => {
    expect(isValidISODate('2024-02-29')).toBe(true);
    expect(isValidISODate('2023-02-29')).toBe(false);
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('26-01-01')).toBe(false);
    expect(isValidISODate('')).toBe(false);
    expect(parseISODate('hello')).toBeNull();
  });
});

describe('calendar arithmetic', () => {
  test('addMonths clamps the day of month', () => {
    expect(toISODate(addMonths(d('2024-01-31'), 1))).toBe('2024-02-29');
    expect(toISODate(addMonths(d('2023-01-31'), 1))).toBe('2023-02-28');
    expect(toISODate(addMonths(d('2024-01-31'), 2))).toBe('2024-03-31');
    expect(toISODate(addMonths(d('2024-11-15'), 3))).toBe('2025-02-15');
    expect(toISODate(addMonths(d('2024-03-15'), -3))).toBe('2023-12-15');
  });

  test('addDays crosses month and year boundaries', () => {
    expect(toISODate(addDays(d('2026-12-31'), 1))).toBe('2027-01-01');
    expect(toISODate(addDays(d('2026-03-01'), -1))).toBe('2026-02-28');
  });

  test('daysBetween ignores DST and time of day', () => {
    expect(daysBetween(d('2026-03-07'), d('2026-03-09'))).toBe(2);
    expect(daysBetween(d('2026-11-01'), d('2026-11-02'))).toBe(1);
    expect(daysBetween(d('2026-01-10'), d('2026-01-01'))).toBe(-9);
    expect(daysBetween(new Date(2026, 0, 1, 23, 59), new Date(2026, 0, 2, 0, 1))).toBe(1);
  });
});

describe('billing cycles', () => {
  test('nthBillDate is anchored, so the 31st survives short months', () => {
    const first = d('2026-01-31');
    expect(toISODate(nthBillDate(first, monthly, 0))).toBe('2026-01-31');
    expect(toISODate(nthBillDate(first, monthly, 1))).toBe('2026-02-28');
    expect(toISODate(nthBillDate(first, monthly, 2))).toBe('2026-03-31');
    expect(toISODate(nthBillDate(first, monthly, 3))).toBe('2026-04-30');
  });

  test('nthBillDate handles every unit', () => {
    const first = d('2026-01-15');
    expect(toISODate(nthBillDate(first, { every: 10, unit: 'day' }, 2))).toBe('2026-02-04');
    expect(toISODate(nthBillDate(first, { every: 2, unit: 'week' }, 3))).toBe('2026-02-26');
    expect(toISODate(nthBillDate(first, { every: 3, unit: 'month' }, 2))).toBe('2026-07-15');
    expect(toISODate(nthBillDate(first, yearly, 2))).toBe('2028-01-15');
  });

  test('nextBillDate returns the first bill on or after today', () => {
    const first = d('2026-01-15');
    expect(toISODate(nextBillDate(first, monthly, d('2025-12-01')))).toBe('2026-01-15');
    expect(toISODate(nextBillDate(first, monthly, d('2026-01-15')))).toBe('2026-01-15');
    expect(toISODate(nextBillDate(first, monthly, d('2026-01-16')))).toBe('2026-02-15');
    expect(toISODate(nextBillDate(first, monthly, d('2026-10-22')))).toBe('2026-11-15');
    expect(toISODate(nextBillDate(first, weekly, d('2026-10-22')))).toBe('2026-10-22');
    expect(toISODate(nextBillDate(first, yearly, d('2026-10-22')))).toBe('2027-01-15');
    expect(toISODate(nextBillDate(d('2020-02-29'), yearly, d('2026-10-22')))).toBe('2027-02-28');
  });

  test('nextBillIndex is exact for long histories and tiny cycles', () => {
    const first = d('2015-06-01');
    const daily: BillingCycle = { every: 1, unit: 'day' };
    const idx = nextBillIndex(first, daily, d('2026-10-22'));
    expect(toISODate(nthBillDate(first, daily, idx))).toBe('2026-10-22');
    expect(toISODate(nthBillDate(first, daily, idx - 1))).toBe('2026-10-21');
  });

  test('upcomingBillDates lists consecutive bills', () => {
    const list = upcomingBillDates(d('2026-01-31'), monthly, d('2026-10-22'), 3).map(toISODate);
    expect(list).toEqual(['2026-10-31', '2026-11-30', '2026-12-31']);
  });

  test('billDatesInRange respects both ends and the cap', () => {
    const list = billDatesInRange(d('2026-01-01'), weekly, d('2026-10-22'), d('2026-11-15')).map(toISODate);
    expect(list).toEqual(['2026-10-22', '2026-10-29', '2026-11-05', '2026-11-12']);
    expect(billDatesInRange(d('2026-01-01'), { every: 1, unit: 'day' }, d('2026-01-01'), d('2030-01-01'), 5)).toHaveLength(5);
    expect(billDatesInRange(d('2027-01-01'), monthly, d('2026-10-22'), d('2026-12-31'))).toHaveLength(0);
  });

  test('billsOnOrBefore counts past bills', () => {
    const first = d('2026-01-15');
    expect(billsOnOrBefore(first, monthly, d('2026-01-14'))).toBe(0);
    expect(billsOnOrBefore(first, monthly, d('2026-01-15'))).toBe(1);
    expect(billsOnOrBefore(first, monthly, d('2026-03-14'))).toBe(2);
    expect(billsOnOrBefore(first, monthly, d('2026-10-22'))).toBe(10);
    expect(billsOnOrBefore(first, yearly, d('2030-01-15'))).toBe(5);
  });
});

describe('labels', () => {
  test('relative day labels', () => {
    expect(relativeDayLabel(0)).toBe('Today');
    expect(relativeDayLabel(1)).toBe('Tomorrow');
    expect(relativeDayLabel(5)).toBe('In 5 days');
    expect(relativeDayLabel(-1)).toBe('Yesterday');
    expect(relativeDayLabel(-3)).toBe('3 days ago');
  });

  test('daysUntil', () => {
    expect(daysUntil(d('2026-10-25'), d('2026-10-22'))).toBe(3);
  });
});
