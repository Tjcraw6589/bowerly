import { StyleSheet, View } from 'react-native';

import { formatMoney } from '@/lib/money';
import type { CategorySpend, TimelinePoint } from '@/lib/stats';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface CategoryBarsProps {
  items: readonly CategorySpend[];
  currency: string;
  locale: string;
}

/** Horizontal bars: one per category, longest first. Plain Views, no chart library. */
export function CategoryBars({ items, currency, locale }: CategoryBarsProps) {
  const { colors, spacing, radius } = useTheme();
  const max = items[0]?.amount ?? 0;
  return (
    <View>
      {items.map((item) => (
        <View key={item.category.id} style={{ marginBottom: spacing.md }}>
          <View style={styles.labelRow}>
            <AppText variant="caption" numberOfLines={1} style={styles.shrink}>
              {item.category.emoji} {item.category.name}
              <AppText variant="caption" tone="faint">
                {'  '}
                {item.count} · {Math.round(item.share * 100)}%
              </AppText>
            </AppText>
            <AppText variant="caption" tone="muted">
              {formatMoney(item.amount, currency, locale)}
            </AppText>
          </View>
          <View style={[styles.track, { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill }]}>
            <View
              style={[
                styles.fill,
                { width: `${max > 0 ? Math.max(3, (item.amount / max) * 100) : 0}%`, backgroundColor: item.category.color, borderRadius: radius.pill },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

interface TimelineColumnsProps {
  points: readonly TimelinePoint[];
  currency: string;
  locale: string;
}

/** Twelve columns of projected cash out per month. */
export function TimelineColumns({ points, currency, locale }: TimelineColumnsProps) {
  const { colors, radius, spacing } = useTheme();
  const max = Math.max(0, ...points.map((p) => p.amount));
  const peak = points.reduce((best, p) => (p.amount > best.amount ? p : best), points[0] ?? { key: '', label: '', amount: 0 });
  return (
    <View>
      <View style={styles.columns}>
        {points.map((p) => {
          const h = max > 0 ? Math.max(4, (p.amount / max) * 110) : 4;
          const isPeak = p.key === peak.key && p.amount > 0;
          return (
            <View key={p.key} style={styles.column}>
              <View style={[styles.bar, { height: h, backgroundColor: isPeak ? colors.primary : colors.primarySoft, borderRadius: radius.sm }]} />
              <AppText variant="small" tone="faint" style={{ marginTop: 4 }}>
                {p.label.slice(0, 3)}
              </AppText>
            </View>
          );
        })}
      </View>
      <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
        Highest month: {peak.label} at {formatMoney(peak.amount, currency, locale)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  shrink: { flexShrink: 1, marginRight: 8 },
  track: { height: 10, overflow: 'hidden' },
  fill: { height: '100%' },
  columns: { flexDirection: 'row', alignItems: 'flex-end', height: 140 },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '70%' },
});
