import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { StatusPill } from '@/components/StatusPill';
import { useLocale } from '@/hooks/useLocale';
import { useToday } from '@/hooks/useToday';
import { findCategory } from '@/lib/categories';
import { formatDate, parseISODate, relativeDayLabel, upcomingBillDates } from '@/lib/dates';
import { cycleLabel, cycleShortLabel, formatMoney, monthlyCost, yearlyCost } from '@/lib/money';
import { isOnTrial, nextEvent, paidToDate } from '@/lib/stats';
import { successHaptic } from '@/services/haptics';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const today = useToday();
  const { languageTag } = useLocale();
  const { colors, spacing } = useTheme();
  const sub = useStore((s) => s.subscriptions.find((x) => x.id === id));
  const categories = useStore((s) => s.categories);
  const setStatus = useStore((s) => s.setSubscriptionStatus);
  const remove = useStore((s) => s.removeSubscription);
  const [confirm, setConfirm] = useState<null | 'delete' | 'cancel'>(null);

  const upcoming = useMemo(() => {
    if (!sub) return [];
    const first = parseISODate(sub.firstBillDate);
    return first ? upcomingBillDates(first, sub.cycle, today, 5) : [];
  }, [sub, today]);

  if (!sub) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header title="" dismiss="back" />
        <EmptyState emoji="🫥" title="Subscription not found" body="It may have been deleted." actionLabel="Back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const category = findCategory(categories, sub.categoryId);
  const event = nextEvent(sub, today);
  const trial = isOnTrial(sub, today);
  const paid = paidToDate(sub, today);
  const startDate = parseISODate(sub.firstBillDate);

  const changeStatus = (status: 'active' | 'paused' | 'cancelled') => {
    const result = setStatus(sub.id, status);
    if (result && !result.ok) {
      router.push({ pathname: '/pro', params: { reason: 'limit' } });
      return;
    }
    successHaptic();
    setConfirm(null);
  };

  const deleteSub = () => {
    remove(sub.id);
    setConfirm(null);
    successHaptic();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Screen scroll edges={['top', 'bottom']} testID="detail-screen">
      <Header
        title=""
        dismiss="back"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit"
            hitSlop={10}
            onPress={() => router.push({ pathname: '/editor', params: { id: sub.id } })}
            testID="detail-edit"
          >
            <AppText variant="bodyBold" tone="primary">
              Edit
            </AppText>
          </Pressable>
        }
      />
      <View style={styles.hero}>
        <Avatar emoji={sub.emoji} color={sub.color} size={84} />
        <AppText variant="title" align="center" style={{ marginTop: spacing.md }}>
          {sub.name}
        </AppText>
        <View style={[styles.pills, { marginTop: spacing.sm }]}>
          <StatusPill label={`${category.emoji} ${category.name}`} tone="primary" />
          {sub.status === 'paused' ? <StatusPill label="Paused" /> : null}
          {sub.status === 'cancelled' ? <StatusPill label="Cancelled" tone="danger" /> : null}
          {trial ? <StatusPill label="Free trial" tone="warning" /> : null}
        </View>
        <View style={[styles.priceRow, { marginTop: spacing.lg }]}>
          <AppText variant="money">{formatMoney(sub.price, sub.currency, languageTag)}</AppText>
          <AppText variant="h3" tone="muted" style={{ marginLeft: 4, marginBottom: 6 }}>
            {cycleShortLabel(sub.cycle)}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted">
          {cycleLabel(sub.cycle)} · {formatMoney(monthlyCost(sub.price, sub.cycle), sub.currency, languageTag)}/mo ·{' '}
          {formatMoney(yearlyCost(sub.price, sub.cycle), sub.currency, languageTag)}/yr
        </AppText>
      </View>

      {event ? (
        <Card style={{ marginTop: spacing.xl }} testID="next-event-card">
          <View style={styles.nextRow}>
            <Ionicons name={event.type === 'trialEnd' ? 'hourglass-outline' : 'refresh-circle-outline'} size={28} color={event.daysUntil <= 3 ? colors.warning : colors.primary} />
            <View style={[styles.flex, { marginLeft: spacing.md }]}>
              <AppText variant="small" tone="muted">
                {event.type === 'trialEnd' ? 'Trial ends' : 'Next renewal'}
              </AppText>
              <AppText variant="h3">
                {relativeDayLabel(event.daysUntil)} · {formatDate(event.date, languageTag)}
              </AppText>
              {event.type === 'trialEnd' ? (
                <AppText variant="caption" tone="muted">
                  Then {formatMoney(sub.price, sub.currency, languageTag)}
                  {cycleShortLabel(sub.cycle)} unless you cancel.
                </AppText>
              ) : null}
            </View>
          </View>
        </Card>
      ) : null}

      <SectionHeader title="Details" />
      <Card padded={false}>
        <Row title="Paid so far" value={formatMoney(paid, sub.currency, languageTag)} chevron={false} />
        <Row title={trial ? 'First paid bill' : 'First bill'} value={startDate ? formatDate(startDate, languageTag) : sub.firstBillDate} chevron={false} />
        <Row
          title="Reminder"
          value={
            sub.reminderDaysBefore === null
              ? 'Off'
              : sub.reminderDaysBefore === 0
                ? 'On the day'
                : `${sub.reminderDaysBefore} day${sub.reminderDaysBefore === 1 ? '' : 's'} before`
          }
          chevron={false}
        />
        <Row title="Notes" subtitle={sub.notes || 'No notes'} chevron={false} last />
      </Card>

      {sub.status === 'active' ? (
        <>
          <SectionHeader title="Upcoming charges" />
          <Card padded={false} testID="upcoming-charges">
            {upcoming.map((d, i) => (
              <Row
                key={d.toISOString()}
                title={formatDate(d, languageTag, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                value={formatMoney(sub.price, sub.currency, languageTag)}
                chevron={false}
                last={i === upcoming.length - 1}
              />
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Actions" />
      <View style={styles.actions}>
        {sub.status === 'active' ? (
          <Button label="Pause" variant="secondary" onPress={() => changeStatus('paused')} icon={<Ionicons name="pause" size={16} color={colors.text} />} testID="action-pause" />
        ) : (
          <Button label="Reactivate" variant="secondary" onPress={() => changeStatus('active')} icon={<Ionicons name="play" size={16} color={colors.text} />} testID="action-reactivate" />
        )}
        {sub.status !== 'cancelled' ? (
          <Button label="Mark cancelled" variant="secondary" onPress={() => setConfirm('cancel')} icon={<Ionicons name="close-circle-outline" size={16} color={colors.text} />} testID="action-cancel" />
        ) : null}
        <Button label="Delete" variant="danger" onPress={() => setConfirm('delete')} icon={<Ionicons name="trash-outline" size={16} color={colors.danger} />} testID="action-delete" />
      </View>
      <View style={{ height: spacing.xl }} />

      <ConfirmSheet
        visible={confirm === 'delete'}
        title={`Delete ${sub.name}?`}
        message="This removes the subscription and its reminders from this device. It cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={deleteSub}
        onCancel={() => setConfirm(null)}
        testID="delete-sheet"
      />
      <ConfirmSheet
        visible={confirm === 'cancel'}
        title={`Mark ${sub.name} as cancelled?`}
        message="Billnest keeps it in your history with the total you paid, stops the reminders and leaves it out of your totals."
        confirmLabel="Mark cancelled"
        onConfirm={() => changeStatus('cancelled')}
        onCancel={() => setConfirm(null)}
        testID="cancel-sheet"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end' },
  nextRow: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flex: { flex: 1 },
});
