import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatShortDate } from '@/lib/dates';
import { amountText, eventLabel } from '@/lib/labels';
import { cycleShortLabel } from '@/lib/money';
import { nextEvent } from '@/lib/stats';
import type { Category, Subscription } from '@/lib/types';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Avatar } from './Avatar';
import { StatusPill } from './StatusPill';

interface SubscriptionRowProps {
  subscription: Subscription;
  category: Category;
  today: Date;
  locale: string;
  onPress: () => void;
  last?: boolean;
}

/** One bill or subscription in a list. */
export function SubscriptionRow({ subscription: s, category, today, locale, onPress, last }: SubscriptionRowProps) {
  const { colors, spacing } = useTheme();
  const event = nextEvent(s, today);
  const overdue = event?.type === 'overdue' && s.status === 'active';
  const nextLabel =
    s.status === 'paused'
      ? 'Paused'
      : s.status === 'cancelled'
        ? 'Cancelled'
        : event
          ? `${eventLabel(event)} · ${formatShortDate(event.date, locale)}`
          : '';
  const soon = event !== null && s.status === 'active' && !overdue && event.daysUntil <= 3;
  const amount = amountText(s, locale);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${s.name}, ${s.kind === 'bill' ? 'bill' : 'subscription'}, ${amount} ${cycleShortLabel(s.cycle)}${
        overdue ? ', overdue' : ''
      }`}
      testID={`subscription-row-${s.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
          opacity: s.status === 'active' ? 1 : 0.7,
        },
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <Avatar emoji={s.emoji} color={s.color} />
      <View style={[styles.middle, { marginHorizontal: spacing.md }]}>
        <View style={styles.titleRow}>
          <AppText variant="bodyBold" numberOfLines={1} style={styles.shrink}>
            {s.name}
          </AppText>
          {overdue ? <StatusPill label="Overdue" tone="danger" /> : null}
          {event?.type === 'trialEnd' ? <StatusPill label="Trial" tone="warning" /> : null}
        </View>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {category.emoji} {category.name}
          {s.kind === 'bill' ? (s.autopay ? ' · Autopay' : ' · Pay by hand') : ''}
        </AppText>
        {nextLabel ? (
          <View style={styles.nextRow}>
            {overdue || soon ? (
              <Ionicons
                name="alert-circle"
                size={13}
                color={overdue ? colors.danger : colors.warning}
                style={{ marginRight: 3 }}
              />
            ) : null}
            <AppText variant="caption" tone={overdue ? 'danger' : soon ? 'warning' : 'faint'} numberOfLines={1}>
              {nextLabel}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.right}>
        <AppText variant="bodyBold">{amount}</AppText>
        <AppText variant="caption" tone="muted">
          {cycleShortLabel(s.cycle)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  middle: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shrink: { flexShrink: 1, marginRight: 2 },
  nextRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  right: { alignItems: 'flex-end' },
});
