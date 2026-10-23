import { StyleSheet, View } from 'react-native';

import { formatMoney, periodSuffix } from '@/lib/money';
import type { CurrencyTotal } from '@/lib/stats';
import type { SummaryPeriod } from '@/lib/types';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Card } from './Card';
import { SegmentedControl } from './SegmentedControl';

interface TotalsHeaderProps {
  totals: CurrencyTotal[];
  period: SummaryPeriod;
  onPeriodChange: (p: SummaryPeriod) => void;
  locale: string;
  activeCount: number;
  trialCount: number;
}

const PERIODS = [
  { key: 'month', label: 'Per month' },
  { key: 'year', label: 'Per year' },
] as const;

export function TotalsHeader({ totals, period, onPeriodChange, locale, activeCount, trialCount }: TotalsHeaderProps) {
  const { spacing } = useTheme();
  const primary = totals[0];
  const others = totals.slice(1);
  const summary = `${activeCount} active${trialCount > 0 ? ` · ${trialCount} on trial` : ''}`;
  return (
    <Card testID="totals-header">
      <View style={styles.top}>
        <View style={styles.flex}>
          <AppText variant="small" tone="muted">
            You spend
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
          <AppText variant="caption" tone="faint" style={{ marginTop: spacing.xs }}>
            {summary}
          </AppText>
        </View>
      </View>
      <View style={{ marginTop: spacing.md }}>
        <SegmentedControl options={PERIODS} value={period} onChange={onPeriodChange} testID="period" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row' },
  flex: { flex: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end' },
});
