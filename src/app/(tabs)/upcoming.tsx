import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

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
import { cycleShortLabel, formatMoney } from '@/lib/money';
import { sumEvents, upcomingEvents } from '@/lib/stats';
import type { UpcomingEvent } from '@/lib/types';
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
  const { spacing } = useTheme();
  const subs = useStore((s) => s.subscriptions);
  const currency = useStore((s) => s.settings.currency);
  const [window, setWindow] = useState<WindowKey>('30');

  const events = useMemo(() => upcomingEvents(subs, today, Number(window)), [subs, today, window]);
  const total = useMemo(() => sumEvents(events, currency), [events, currency]);
  const otherCurrencies = useMemo(() => {
    const set = new Set(events.filter((e) => e.type === 'bill' && e.subscription.currency !== currency).map((e) => e.subscription.currency));
    return [...set];
  }, [events, currency]);
  const sections = useMemo(() => {
    const map = new Map<string, UpcomingEvent[]>();
    for (const e of events) {
      const key = toISODate(e.date);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return [...map.entries()].map(([key, data]) => ({ key, date: data[0]?.date ?? today, data }));
  }, [events, today]);

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
          Due in the next {window} days
        </AppText>
        <AppText variant="money">{formatMoney(total, currency, languageTag)}</AppText>
        <AppText variant="caption" tone="faint">
          {events.filter((e) => e.type === 'bill').length} charges
          {otherCurrencies.length > 0 ? ` · plus charges in ${otherCurrencies.join(', ')}` : ''}
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
                  : cycleShortLabel(item.subscription.cycle).replace('/', 'Every ')
              }
              right={
                item.type === 'trialEnd' ? (
                  <StatusPill label="Trial ends" tone="warning" />
                ) : (
                  <AppText variant="bodyBold">{formatMoney(item.subscription.price, item.subscription.currency, languageTag)}</AppText>
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
              body={subs.length === 0 ? 'Add a subscription and its renewals will show up here.' : `No renewals in the next ${window} days.`}
              testID="upcoming-empty"
            />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cardTop: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
  cardMiddle: { borderRadius: 0, borderBottomWidth: 0 },
  cardBottom: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
});
