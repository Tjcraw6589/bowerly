import { BUILT_IN_CATEGORIES } from '@/lib/categories';
import { csvEscape, parseCSV, parseSubscriptionsCSV, subscriptionsToCSV } from '@/lib/csv';

import { makeSub, TODAY } from '../helpers';

let ids = 0;
const defaults = { currency: 'USD', today: TODAY, newCategoryId: () => `new-${++ids}` };

describe('parseCSV', () => {
  test('handles quotes, escaped quotes, embedded commas and newlines, CRLF and BOM', () => {
    const text = '﻿a,b,c\r\n"x, y","he said ""hi""","line1\nline2"\n1,2,3\n';
    expect(parseCSV(text)).toEqual([
      ['a', 'b', 'c'],
      ['x, y', 'he said "hi"', 'line1\nline2'],
      ['1', '2', '3'],
    ]);
  });

  test('ignores blank lines', () => {
    expect(parseCSV('a\n\n\nb\n')).toEqual([['a'], ['b']]);
  });

  test('csvEscape quotes only when needed', () => {
    expect(csvEscape('plain')).toBe('plain');
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });
});

describe('export and import round trip', () => {
  test('exported rows import back with the same fields', () => {
    const subs = [
      makeSub({ name: 'Netflix, Premium', price: 15.49, notes: 'Shared with "family"\nsecond line', reminderDaysBefore: 3 }),
      makeSub({ name: 'Gym', price: 40, cycle: { every: 2, unit: 'week' }, categoryId: 'cat_fitness', status: 'paused', reminderDaysBefore: null }),
      makeSub({ name: 'Trial thing', price: 9, trialEndDate: '2026-11-01', firstBillDate: '2026-11-02' }),
    ];
    const csv = subscriptionsToCSV(subs, BUILT_IN_CATEGORIES);
    expect(csv.split('\r\n')[0]).toBe(
      'name,price,currency,cycle_every,cycle_unit,first_bill_date,category,color,emoji,notes,reminder_days_before,status,trial_end_date',
    );
    const result = parseSubscriptionsCSV(csv, BUILT_IN_CATEGORIES, defaults);
    expect(result.errors).toEqual([]);
    expect(result.newCategories).toEqual([]);
    expect(result.drafts).toHaveLength(3);
    const [netflix, gym, trial] = result.drafts;
    expect(netflix).toMatchObject({
      name: 'Netflix, Premium',
      price: 15.49,
      currency: 'USD',
      cycle: { every: 1, unit: 'month' },
      firstBillDate: '2026-01-15',
      categoryId: 'cat_streaming',
      notes: 'Shared with "family"\nsecond line',
      reminderDaysBefore: 3,
      status: 'active',
      trialEndDate: null,
    });
    expect(gym).toMatchObject({ cycle: { every: 2, unit: 'week' }, categoryId: 'cat_fitness', status: 'paused', reminderDaysBefore: null });
    expect(trial).toMatchObject({ trialEndDate: '2026-11-01', firstBillDate: '2026-11-02' });
  });
});

describe('importing hand-made files', () => {
  test('fills defaults and creates unknown categories', () => {
    const text = 'Name,Price,Category,Cycle Unit\nSpotify,9.99,,monthly\nPet insurance,"25,50",Pets,month\n';
    const result = parseSubscriptionsCSV(text, BUILT_IN_CATEGORIES, defaults);
    expect(result.errors).toEqual([]);
    expect(result.drafts).toHaveLength(2);
    expect(result.drafts[0]).toMatchObject({
      name: 'Spotify',
      price: 9.99,
      currency: 'USD',
      cycle: { every: 1, unit: 'month' },
      firstBillDate: '2026-10-22',
      categoryId: 'cat_other',
      status: 'active',
    });
    expect(result.newCategories).toHaveLength(1);
    expect(result.newCategories[0]?.name).toBe('Pets');
    expect(result.drafts[1]?.categoryId).toBe(result.newCategories[0]?.id);
    expect(result.drafts[1]?.price).toBe(25.5);
  });

  test('reports bad rows without importing them', () => {
    const text = [
      'name,price,cycle_unit,first_bill_date,status,reminder_days_before,currency',
      ',5,month,2026-01-01,active,1,USD',
      'Bad price,abc,month,2026-01-01,active,1,USD',
      'Bad unit,5,fortnight,2026-01-01,active,1,USD',
      'Bad date,5,month,2026-02-30,active,1,USD',
      'Bad status,5,month,2026-01-01,sleeping,1,USD',
      'Bad reminder,5,month,2026-01-01,active,99,USD',
      'Bad currency,5,month,2026-01-01,active,1,DOLLARS',
      'Good,5,year,2026-01-01,cancelled,,eur',
    ].join('\n');
    const result = parseSubscriptionsCSV(text, BUILT_IN_CATEGORIES, defaults);
    expect(result.errors.map((e) => e.row)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]).toMatchObject({ name: 'Good', currency: 'EUR', status: 'cancelled', cycle: { every: 1, unit: 'year' } });
    expect(result.drafts[0]?.cancelledAt).not.toBeNull();
  });

  test('rejects files without the required columns', () => {
    expect(parseSubscriptionsCSV('foo,bar\n1,2', BUILT_IN_CATEGORIES, defaults).errors[0]?.message).toContain('"name" and "price"');
    expect(parseSubscriptionsCSV('', BUILT_IN_CATEGORIES, defaults).errors[0]?.message).toContain('empty');
  });
});
