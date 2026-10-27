import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryBars, TimelineColumns } from '@/components/Charts';
import { EmptyState } from '@/components/EmptyState';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { useLocale } from '@/hooks/useLocale';
import { useToday } from '@/hooks/useToday';
import { formatMoney } from '@/lib/money';
import { counts, monthlyTimeline, mostExpensive, spendByCategory, totalsByCurrency } from '@/lib/stats';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

export default function InsightsScreen() {
  const router = useRouter();
  const today = useToday();
  const { languageTag } = useLocale();
  const { colors, spacing, radius } = useTheme();
  const subs = useStore((s) => s.subscriptions);
  const categories = useStore((s) => s.categories);
  const currency = useStore((s) => s.settings.currency);
  const isPro = useStore((s) => s.meta.isPro);

  const monthly = useMemo(() => totalsByCurrency(subs, 'month', currency, today), [subs, currency, today]);
  const yearly = useMemo(() => totalsByCurrency(subs, 'year', currency, today), [subs, currency, today]);
  const tally = useMemo(() => counts(subs, today), [subs, today]);
  const top = useMemo(() => mostExpensive(subs, 'month', currency, today, 5), [subs, currency, today]);
  const byCategory = useMemo(() => spendByCategory(subs, categories, 'month', currency, today), [subs, categories, currency, today]);
  const timeline = useMemo(() => monthlyTimeline(subs, today, currency, 12, languageTag), [subs, today, currency, languageTag]);

  const hasData = subs.some((s) => s.status === 'active');

  return (
    <Screen scroll testID="insights-screen" footer={<AdBanner />}>
      <AppText variant="title" style={{ marginTop: spacing.md }}>
        Insights
      </AppText>
      {!hasData ? (
        <View style={{ marginTop: spacing.xxl }}>
          <EmptyState emoji="📊" title="No insights yet" body="Once you have active subscriptions, this tab breaks down where the money goes." testID="insights-empty" />
        </View>
      ) : (
        <>
          <View style={[styles.pair, { marginTop: spacing.lg }]}>
            <Card style={styles.half} testID="insight-monthly">
              <AppText variant="small" tone="muted">
                Per month
              </AppText>
              <AppText variant="h2">{formatMoney(monthly[0]?.amount ?? 0, currency, languageTag)}</AppText>
            </Card>
            <View style={{ width: spacing.md }} />
            <Card style={styles.half} testID="insight-yearly">
              <AppText variant="small" tone="muted">
                Per year
              </AppText>
              <AppText variant="h2">{formatMoney(yearly[0]?.amount ?? 0, currency, languageTag)}</AppText>
            </Card>
          </View>
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.statsRow}>
              <Stat label="Active" value={tally.active} />
              <Stat label="On trial" value={tally.trials} />
              <Stat label="Paused" value={tally.paused} />
              <Stat label="Cancelled" value={tally.cancelled} />
            </View>
          </Card>

          <SectionHeader title="Most expensive" />
          <Card padded={false}>
            {top.length === 0 ? (
              <AppText variant="caption" tone="muted" style={{ padding: spacing.lg }}>
                No paid subscriptions in {currency} yet.
              </AppText>
            ) : (
              top.map((item, i) => (
                <Row
                  key={item.subscription.id}
                  left={<Avatar emoji={item.subscription.emoji} color={item.subscription.color} size={36} />}
                  title={item.subscription.name}
                  value={`${formatMoney(item.amount, currency, languageTag)}/mo`}
                  chevron={false}
                  onPress={() => router.push({ pathname: '/subscription/[id]', params: { id: item.subscription.id } })}
                  last={i === top.length - 1}
                />
              ))
            )}
          </Card>

          <SectionHeader title="By category" right={!isPro ? <ProTag /> : undefined} />
          {isPro ? (
            <Card testID="category-chart">
              {byCategory.length === 0 ? (
                <AppText variant="caption" tone="muted">
                  No paid subscriptions in {currency} yet.
                </AppText>
              ) : (
                <CategoryBars items={byCategory} currency={currency} locale={languageTag} />
              )}
            </Card>
          ) : (
            <LockedCard
              body="See which categories eat the biggest share of your budget."
              onPress={() => router.push({ pathname: '/pro', params: { reason: 'insights' } })}
            />
          )}

          <SectionHeader title="Next 12 months" right={!isPro ? <ProTag /> : undefined} />
          {isPro ? (
            <Card testID="timeline-chart">
              <TimelineColumns points={timeline} currency={currency} locale={languageTag} />
            </Card>
          ) : (
            <LockedCard
              body="A month-by-month projection of what will leave your account, so yearly renewals never surprise you."
              onPress={() => router.push({ pathname: '/pro', params: { reason: 'insights' } })}
            />
          )}
          <View style={{ height: spacing.lg }} />
        </>
      )}
      <View style={[styles.hint, { borderRadius: radius.md, backgroundColor: colors.surfaceAlt, padding: spacing.md }]}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
        <AppText variant="caption" tone="muted" style={styles.flex}>
          Totals cover active subscriptions in {currency}. Free trials are excluded until they convert; other currencies are listed separately
          because Billnest never looks up exchange rates.
        </AppText>
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <AppText variant="h2">{value}</AppText>
      <AppText variant="small" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

function ProTag() {
  const { colors, radius } = useTheme();
  return (
    <View style={{ backgroundColor: colors.proSoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
      <AppText variant="small" tone="pro">
        PRO
      </AppText>
    </View>
  );
}

function LockedCard({ body, onPress }: { body: string; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  return (
    <Card testID="locked-card">
      <View style={styles.lockRow}>
        <Ionicons name="lock-closed" size={20} color={colors.pro} style={{ marginRight: spacing.sm }} />
        <AppText variant="body" tone="muted" style={styles.flex}>
          {body}
        </AppText>
      </View>
      <Button label="Unlock with Pro" variant="pro" size="sm" onPress={onPress} style={{ marginTop: spacing.md }} />
    </Card>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row' },
  half: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  lockRow: { flexDirection: 'row', alignItems: 'center' },
  hint: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  flex: { flex: 1 },
});
