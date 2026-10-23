import type { BillingCycle, CycleUnit, SummaryPeriod } from './types';

const CYCLES_PER_YEAR: Record<CycleUnit, number> = {
  day: 365.25,
  week: 365.25 / 7,
  month: 12,
  year: 1,
};

export function yearlyCost(price: number, cycle: BillingCycle): number {
  return (price * CYCLES_PER_YEAR[cycle.unit]) / cycle.every;
}

export function monthlyCost(price: number, cycle: BillingCycle): number {
  return yearlyCost(price, cycle) / 12;
}

export function costForPeriod(price: number, cycle: BillingCycle, period: SummaryPeriod): number {
  return period === 'month' ? monthlyCost(price, cycle) : yearlyCost(price, cycle);
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function formatWithDisplay(
  amount: number,
  currency: string,
  locale: string,
  currencyDisplay: 'narrowSymbol' | 'symbol',
  compact: boolean,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay,
    ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
  }).format(amount);
}

/** Formats money for display. Falls back gracefully when the runtime lacks a formatter for the code. */
export function formatMoney(amount: number, currency: string, locale = 'en-US', options?: { compact?: boolean }): string {
  const compact = options?.compact ?? false;
  try {
    return formatWithDisplay(amount, currency, locale, 'narrowSymbol', compact);
  } catch {
    try {
      return formatWithDisplay(amount, currency, locale, 'symbol', compact);
    } catch {
      return `${currency} ${roundMoney(amount).toFixed(2)}`;
    }
  }
}

/** "1.299.000" is thousands grouping; "1.2.3" is not. */
function isGrouped(parts: string[]): boolean {
  return parts.length >= 2 && (parts[0] ?? '').length >= 1 && parts.slice(1).every((p) => p.length === 3);
}

/**
 * Parses user-typed prices such as "9.99", "9,99", "$1,299.00", "1 234,56".
 * When the locale's decimal separator is known, it is trusted; otherwise a heuristic is used.
 */
export function parsePriceInput(raw: string, decimalSeparator?: '.' | ','): number | null {
  const cleaned = raw.trim().replace(/[^\d.,]/g, '');
  if (!cleaned) return null;

  let normalized: string;
  if (decimalSeparator) {
    const grouping = decimalSeparator === '.' ? ',' : '.';
    normalized = cleaned.split(grouping).join('').replace(decimalSeparator, '.');
  } else {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) {
      const decSep = lastComma > lastDot ? ',' : '.';
      const grouping = decSep === ',' ? '.' : ',';
      normalized = cleaned.split(grouping).join('').replace(decSep, '.');
    } else if (lastComma >= 0) {
      const parts = cleaned.split(',');
      const tail = parts[parts.length - 1] ?? '';
      if (parts.length === 2 && tail.length <= 2) normalized = parts.join('.');
      else if (isGrouped(parts)) normalized = parts.join('');
      else return null;
    } else if (lastDot >= 0) {
      const parts = cleaned.split('.');
      if (parts.length === 2) normalized = cleaned;
      else if (isGrouped(parts)) normalized = parts.join('');
      else return null;
    } else {
      normalized = cleaned;
    }
  }

  if (normalized.split('.').length > 2) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return roundMoney(n);
}

export function cycleLabel(cycle: BillingCycle): string {
  const { every, unit } = cycle;
  if (every === 1) {
    return { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' }[unit];
  }
  if (unit === 'month' && every === 3) return 'Quarterly';
  if (unit === 'month' && every === 6) return 'Every 6 months';
  const plural = { day: 'days', week: 'weeks', month: 'months', year: 'years' }[unit];
  return `Every ${every} ${plural}`;
}

export function cycleShortLabel(cycle: BillingCycle): string {
  const { every, unit } = cycle;
  if (every === 1) return { day: '/day', week: '/wk', month: '/mo', year: '/yr' }[unit];
  if (unit === 'month' && every === 3) return '/qtr';
  const abbr = { day: 'd', week: 'wk', month: 'mo', year: 'yr' }[unit];
  return `/${every} ${abbr}`;
}

export const CYCLE_PRESETS: readonly { label: string; cycle: BillingCycle }[] = [
  { label: 'Weekly', cycle: { every: 1, unit: 'week' } },
  { label: 'Monthly', cycle: { every: 1, unit: 'month' } },
  { label: 'Quarterly', cycle: { every: 3, unit: 'month' } },
  { label: 'Yearly', cycle: { every: 1, unit: 'year' } },
];

export function cyclesEqual(a: BillingCycle, b: BillingCycle): boolean {
  return a.every === b.every && a.unit === b.unit;
}

export function isPresetCycle(cycle: BillingCycle): boolean {
  return CYCLE_PRESETS.some((p) => cyclesEqual(p.cycle, cycle));
}

export function periodSuffix(period: SummaryPeriod): string {
  return period === 'month' ? '/mo' : '/yr';
}
