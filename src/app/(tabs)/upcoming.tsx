import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatusPill } from '@/components/StatusPill';
import { useLocale } from '@/hooks/useLocale';
import { useToday } from '@/hooks/useToday';
import { formatDate, formatWeekday, relativeDayLabel, toISODate } from '@/lib/dates';
import { amountText, eventLabel, paymentMethodLabel } from '@/lib/labels';
import { cycleLabel, cycleShortLabel, formatMoney } from '@/lib/money';
import { isManualBill } from '@/lib/payments';
import { sumEvents, upcomingEvents } from '@/lib/stats';
import type { UpcomingEvent } from '@/lib/types';
import { successHaptic } from '@/services/haptics';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

const WINDOWS = [
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
] as const;
type WindowKey = (typeof WINDOWS)[number]['key'];

export default function UpcomingScreen() {
  const router = useRouter();
  const today = useToday();
  const { languageTag } = useLocale();
  const { colors, spacing, radius } = useTheme();
  const markPaid = useStore((s) => s.markPaid);
  const subs = useStore((s) => s.subscriptions);
  const currency = useStore((s) => s.settings.currency);
  const [window, setWindow] = useState<WindowKey>('30');

  const events = useMemo(() => upcomingEvents(subs, today, Number(window)), [subs, today, window]);
  const total = useMemo(() => sumEvents(events, currency), [events, currency]);
  const otherCurrencies = useMemo(() => {
    const set = new Set(events.filter((e) => e.type !== 'trialEnd' && e.subscription.currency !== currency).map((e) => e.subscription.currency));
    return [...set];
  }, [events, currency]);
  const sections = useMemo(() => {
    const map = new Map<string, UpcomingEvent[]>();
    for (const e of events) {
      // Everything overdue goes in one section at the top.
      const key = e.type === 'overdue' ? 'overdue' : toISODate(e.date);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return [...map.entries()].map(([key, data]) => ({ key, date: data[0]?.date ?? today, data }));
  }, [events, today]);
  /** "Mark paid" goes on the earliest unpaid date of each hand-paid bill, since that is the one it marks. */
  const payable = useMemo(() => {
    const seen = new Set<string>();
    const keys = new Set<string>();
    for (const e of events) {
      if (e.type === 'trialEnd' || !isManualBill(e.subscription) || seen.has(e.subscription.id)) continue;
      seen.add(e.subscription.id);
      keys.add(`${e.subscription.id}-${toISODate(e.date)}`);
    }
    return keys;
  }, [events]);
  const overdueCount = events.filter((e) => e.type === 'overdue').length;
  const paymentCount = events.filter((e) => e.type !== 'trialEnd').length;

  const header = (
    <View>
      <AppText variant="title" style={{ marginTop: spacing.md }}>
        Upcoming
      </AppText>
      <View style={{ marginTop: spacing.md }}>
        <SegmentedControl options={WINDOWS} value={window} onChange={setWindow} testID="window" />
      </View>
      <Card style={{ marginTop: spacing.lg }} testID="upcoming-total">
        <AppText variant="small" tone="muted">
          Due in the next {window} days{overdueCount > 0 ? ', including overdue' : ''}
        </AppText>
        <AppText variant="money">{formatMoney(total, currency, languageTag)}</AppText>
        <AppText variant="caption" tone="faint">
          {paymentCount} {paymentCount === 1 ? 'payment' : 'payments'}
          {overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}
          {otherCurrencies.length > 0 ? ` · plus payments in ${otherCurrencies.join(', ')}` : ''}
        </AppText>
      </Card>
    </View>
  );

  return (
    <Screen padded={false} testID="upcoming-screen" footer={<AdBanner />}>
      <SectionList
        sections={sections}
        keyExtractor={(e) => `${e.subscription.id}-${e.type}-${toISODate(e.date)}`}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => {
          if (section.key === 'overdue') {
            return (
              <View style={[styles.dateRow, { marginTop: spacing.lg, marginBottom: spacing.xs }]} testID="overdue-section">
                <AppText variant="h3" tone="danger">
                  Overdue
                </AppText>
                <AppText variant="caption" tone="danger">
                  {section.data.length} unpaid
                </AppText>
              </View>
            );
          }
          const days = Math.round((section.date.getTime() - today.getTime()) / 86_400_000);
          return (
            <View style={[styles.dateRow, { marginTop: spacing.lg, marginBottom: spacing.xs }]}>
              <AppText variant="h3">
                {formatWeekday(section.date, languageTag)}, {formatDate(section.date, languageTag, { month: 'short', day: 'numeric' })}
              </AppText>
              <AppText variant="caption" tone="muted">
                {relativeDayLabel(days)}
              </AppText>
            </View>
          );
        }}
        renderItem={({ item, index, section }) => (
          <Card padded={false} style={index === 0 ? styles.cardTop : index === section.data.length - 1 ? styles.cardBottom : styles.cardMiddle}>
            <Row
              left={<Avatar emoji={item.subscription.emoji} color={item.subscription.color} size={38} />}
              title={item.subscription.name}
              subtitle={
                item.type === 'trialEnd'
                  ? `Free trial ends · then ${formatMoney(item.subscription.price, item.subscription.currency, languageTag)}${cycleShortLabel(item.subscription.cycle)}`
                  : item.type === 'overdue'
                    ? `${eventLabel(item)} · was due ${formatDate(item.date, languageTag, { month: 'short', day: 'numeric' })}`
                    : `${cycleLabel(item.subscription.cycle)} · ${paymentMethodLabel(item.subscription)}`
              }
              right={
                item.type === 'trialEnd' ? (
                  <StatusPill label="Trial ends" tone="warning" />
                ) : (
                  <View style={styles.right}>
                    <AppText variant="bodyBold" tone={item.type === 'overdue' ? 'danger' : 'text'}>
                      {amountText(item.subscription, languageTag)}
                    </AppText>
                    {payable.has(`${item.subscription.id}-${toISODate(item.date)}`) ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Mark ${item.subscription.name} paid`}
                        hitSlop={8}
                        onPress={() => {
                          markPaid(item.subscription.id, today);
                          successHaptic();
                        }}
                        style={[styles.payButton, { backgroundColor: colors.primarySoft, borderRadius: radius.pill }]}
                        testID={`mark-paid-${item.subscription.id}`}
                      >
                        <AppText variant="small" tone="primary">
                          Mark paid
                        </AppText>
                      </Pressable>
                    ) : null}
                  </View>
                )
              }
              chevron={false}
              onPress={() => router.push({ pathname: '/subscription/[id]', params: { id: item.subscription.id } })}
              last
            />
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ marginTop: spacing.xl }}>
            <EmptyState
              emoji="🌤️"
              title="Nothing due"
              body={subs.length === 0 ? 'Add a bill or subscription and its due dates will show up here.' : `Nothing due in the next ${window} days.`}
              testID="upcoming-empty"
            />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  right: { alignItems: 'flex-end', gap: 4 },
  payButton: { paddingHorizontal: 10, paddingVertical: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cardTop: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
  cardMiddle: { borderRadius: 0, borderBottomWidth: 0 },
  cardBottom: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
});
