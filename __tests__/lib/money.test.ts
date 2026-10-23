import {
  costForPeriod,
  cycleLabel,
  cycleShortLabel,
  formatMoney,
  isPresetCycle,
  monthlyCost,
  parsePriceInput,
  roundMoney,
  yearlyCost,
} from '@/lib/money';

describe('cost normalisation', () => {
  test('yearly and monthly equivalents', () => {
    expect(yearlyCost(120, { every: 1, unit: 'year' })).toBe(120);
    expect(monthlyCost(120, { every: 1, unit: 'year' })).toBe(10);
    expect(monthlyCost(30, { every: 3, unit: 'month' })).toBe(10);
    expect(monthlyCost(20, { every: 2, unit: 'month' })).toBe(10);
    expect(monthlyCost(10, { every: 1, unit: 'month' })).toBe(10);
    expect(roundMoney(monthlyCost(10, { every: 1, unit: 'week' }))).toBe(43.48);
    expect(roundMoney(yearlyCost(1, { every: 1, unit: 'day' }))).toBe(365.25);
    expect(roundMoney(monthlyCost(10, { every: 2, unit: 'week' }))).toBe(21.74);
  });

  test('costForPeriod switches on the period', () => {
    expect(costForPeriod(120, { every: 1, unit: 'year' }, 'month')).toBe(10);
    expect(costForPeriod(10, { every: 1, unit: 'month' }, 'year')).toBe(120);
  });

  test('roundMoney avoids binary drift', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});

describe('parsePriceInput', () => {
  test('accepts common ways of typing a price', () => {
    expect(parsePriceInput('9.99')).toBe(9.99);
    expect(parsePriceInput('9,99')).toBe(9.99);
    expect(parsePriceInput('$1,299.00')).toBe(1299);
    expect(parsePriceInput('1.299,00')).toBe(1299);
    expect(parsePriceInput('1 234,56')).toBe(1234.56);
    expect(parsePriceInput('1,500')).toBe(1500);
    expect(parsePriceInput('1.299.000')).toBe(1299000);
    expect(parsePriceInput('1,299,000.50')).toBe(1299000.5);
    expect(parsePriceInput('15')).toBe(15);
    expect(parsePriceInput(' 7 ')).toBe(7);
    expect(parsePriceInput('0')).toBe(0);
  });

  test('uses the locale separator when known', () => {
    expect(parsePriceInput('1.234,5', ',')).toBe(1234.5);
    expect(parsePriceInput('1,5', ',')).toBe(1.5);
    expect(parsePriceInput('1,234.5', '.')).toBe(1234.5);
    expect(parsePriceInput('1.500', '.')).toBe(1.5);
  });

  test('rejects garbage', () => {
    expect(parsePriceInput('')).toBeNull();
    expect(parsePriceInput('abc')).toBeNull();
    expect(parsePriceInput('1.2.3')).toBeNull();
    expect(parsePriceInput('1,2,3')).toBeNull();
    expect(parsePriceInput('.')).toBeNull();
  });
});

describe('formatMoney', () => {
  test('formats known currencies', () => {
    expect(formatMoney(9.99, 'USD', 'en-US')).toBe('$9.99');
    expect(formatMoney(1234.5, 'USD', 'en-US')).toBe('$1,234.50');
    expect(formatMoney(5, 'GBP', 'en-GB')).toBe('£5.00');
  });

  test('falls back for unknown codes instead of throwing', () => {
    const out = formatMoney(3, 'ZZZ', 'en-US');
    expect(out).toContain('ZZZ');
    expect(out).toContain('3.00');
  });
});

describe('cycle labels', () => {
  test('human labels', () => {
    expect(cycleLabel({ every: 1, unit: 'month' })).toBe('Monthly');
    expect(cycleLabel({ every: 3, unit: 'month' })).toBe('Quarterly');
    expect(cycleLabel({ every: 6, unit: 'month' })).toBe('Every 6 months');
    expect(cycleLabel({ every: 2, unit: 'week' })).toBe('Every 2 weeks');
    expect(cycleLabel({ every: 1, unit: 'year' })).toBe('Yearly');
    expect(cycleShortLabel({ every: 1, unit: 'month' })).toBe('/mo');
    expect(cycleShortLabel({ every: 3, unit: 'month' })).toBe('/qtr');
    expect(cycleShortLabel({ every: 2, unit: 'week' })).toBe('/2 wk');
  });

  test('preset detection', () => {
    expect(isPresetCycle({ every: 1, unit: 'week' })).toBe(true);
    expect(isPresetCycle({ every: 2, unit: 'week' })).toBe(false);
  });
});
