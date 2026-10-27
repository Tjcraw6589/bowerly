import { StyleSheet, View } from 'react-native';

import { formatMoney, periodSuffix } from '@/lib/money';
import type { CurrencyTotal, KindTotals } from '@/lib/stats';
import type { SummaryPeriod } from '@/lib/types';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Card } from './Card';
import { SegmentedControl } from './SegmentedControl';

interface TotalsHeaderProps {
  totals: CurrencyTotal[];
  /** Bills vs subscriptions in the primary currency. */
  split: KindTotals;
  period: SummaryPeriod;
  onPeriodChange: (p: SummaryPeriod) => void;
  locale: string;
  trialCount: number;
  overdueCount: number;
}

const PERIODS = [
  { key: 'month', label: 'Per month' },
  { key: 'year', label: 'Per year' },
] as const;

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function TotalsHeader({ totals, split, period, onPeriodChange, locale, trialCount, overdueCount }: TotalsHeaderProps) {
  const { colors, spacing, radius } = useTheme();
  const primary = totals[0];
  const others = totals.slice(1);
  const currency = primary?.currency ?? 'USD';
  const parts = [plural(split.billCount, 'bill', 'bills'), plural(split.subscriptionCount, 'subscription', 'subscriptions')];
  if (trialCount > 0) parts.push(`${trialCount} on trial`);
  return (
    <Card testID="totals-header">
      <AppText variant="small" tone="muted">
        Going out
      </AppText>
      <View style={styles.amountRow}>
        <AppText variant="money" testID="totals-amount">
          {primary ? formatMoney(primary.amount, primary.currency, locale) : ''}
        </AppText>
        <AppText variant="h3" tone="muted" style={{ marginLeft: 4, marginBottom: 6 }}>
          {periodSuffix(period)}
        </AppText>
      </View>
      {others.map((t) => (
        <AppText key={t.currency} variant="caption" tone="muted">
          + {formatMoney(t.amount, t.currency, locale)}
          {periodSuffix(period)} in {t.currency}
        </AppText>
      ))}
      <View style={[styles.split, { marginTop: spacing.sm, gap: spacing.sm }]} testID="totals-split">
        <View style={[styles.splitCell, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm }]}>
          <AppText variant="small" tone="muted">
            Bills
          </AppText>
          <AppText variant="bodyBold">{formatMoney(split.bills, currency, locale)}</AppText>
        </View>
        <View style={[styles.splitCell, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm }]}>
          <AppText variant="small" tone="muted">
            Subscriptions
          </AppText>
          <AppText variant="bodyBold">{formatMoney(split.subscriptions, currency, locale)}</AppText>
        </View>
      </View>
      <AppText variant="caption" tone="faint" style={{ marginTop: spacing.sm }}>
        {parts.join(' · ')}
      </AppText>
      {overdueCount > 0 ? (
        <AppText variant="caption" tone="danger" style={{ marginTop: 2 }} testID="totals-overdue">
          {plural(overdueCount, 'bill is', 'bills are')} overdue
        </AppText>
      ) : null}
      <View style={{ marginTop: spacing.md }}>
        <SegmentedControl options={PERIODS} value={period} onChange={onPeriodChange} testID="period" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  amountRow: { flexDirection: 'row', alignItems: 'flex-end' },
  split: { flexDirection: 'row' },
  splitCell: { flex: 1 },
});
