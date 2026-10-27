import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, StyleSheet, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { FAB } from '@/components/FAB';
import { Notice } from '@/components/Notice';
import { OptionSheet } from '@/components/OptionSheet';
import { Screen } from '@/components/Screen';
import { SubscriptionRow } from '@/components/SubscriptionRow';
import { TextField } from '@/components/TextField';
import { TotalsHeader } from '@/components/TotalsHeader';
import { useLocale } from '@/hooks/useLocale';
import { useToday } from '@/hooks/useToday';
import { findCategory } from '@/lib/categories';
import { canAddActiveSubscription, FREE_ACTIVE_LIMIT } from '@/lib/limits';
import { filterSubscriptions, SORT_OPTIONS, sortSubscriptions } from '@/lib/sort';
import { counts, totalsByCurrency } from '@/lib/stats';
import type { Subscription } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const today = useToday();
  const { languageTag } = useLocale();
  const { colors, spacing } = useTheme();
  const subs = useStore((s) => s.subscriptions);
  const categories = useStore((s) => s.categories);
  const settings = useStore((s) => s.settings);
  const isPro = useStore((s) => s.meta.isPro);
  const updateSettings = useStore((s) => s.updateSettings);

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);

  const tally = useMemo(() => counts(subs, today), [subs, today]);
  const totals = useMemo(
    () => totalsByCurrency(subs, settings.summaryPeriod, settings.currency, today),
    [subs, settings.summaryPeriod, settings.currency, today],
  );
  const sections = useMemo(() => {
    const visible = sortSubscriptions(filterSubscriptions(subs, query, categoryId), settings.sortBy, today);
    const group = (status: Subscription['status'], title: string) => ({ title, data: visible.filter((s) => s.status === status) });
    return [group('active', 'Active'), group('paused', 'Paused'), group('cancelled', 'Cancelled')].filter((g) => g.data.length > 0);
  }, [subs, query, categoryId, settings.sortBy, today]);
  const usedCategories = useMemo(
    () => categories.filter((c) => subs.some((s) => s.categoryId === c.id)),
    [categories, subs],
  );

  const onAdd = () => {
    if (canAddActiveSubscription(tally.active, isPro)) router.push('/editor');
    else router.push({ pathname: '/pro', params: { reason: 'limit' } });
  };

  const nearLimit = !isPro && tally.active >= FREE_ACTIVE_LIMIT - 2;

  if (subs.length === 0) {
    return (
      <Screen testID="subscriptions-screen" footer={<AdBanner />}>
        <AppText variant="title" style={{ marginTop: spacing.md }}>
          Subscriptions
        </AppText>
        <View style={styles.flex}>
          <EmptyState
            emoji="🧾"
            title="No subscriptions yet"
            body="Add the services you pay for and Billnest will tally the cost and remind you before each renewal."
            actionLabel="Add your first subscription"
            onAction={onAdd}
            testID="empty-state"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} testID="subscriptions-screen" footer={<AdBanner />}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 96 }}
        ListHeaderComponent={
          <View>
            <View style={[styles.titleRow, { marginTop: spacing.md, marginBottom: spacing.md }]}>
              <AppText variant="title">Subscriptions</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sort"
                hitSlop={10}
                onPress={() => setSortOpen(true)}
                style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                testID="sort-button"
              >
                <Ionicons name="swap-vertical" size={20} color={colors.text} />
              </Pressable>
            </View>
            <TotalsHeader
              totals={totals}
              period={settings.summaryPeriod}
              onPeriodChange={(summaryPeriod) => updateSettings({ summaryPeriod })}
              locale={languageTag}
              activeCount={tally.active}
              trialCount={tally.trials}
            />
            {nearLimit ? (
              <View style={{ marginTop: spacing.md }}>
                <Notice
                  tone="pro"
                  message={`${tally.active} of ${FREE_ACTIVE_LIMIT} free active subscriptions used. Pro removes the limit and the ads.`}
                  actionLabel="See Pro"
                  onAction={() => router.push({ pathname: '/pro', params: { reason: 'limit' } })}
                  testID="limit-notice"
                />
              </View>
            ) : null}
            {subs.length > 4 ? (
              <View style={{ marginTop: spacing.lg }}>
                <TextField
                  placeholder="Search subscriptions"
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  returnKeyType="search"
                  left={<Ionicons name="search" size={18} color={colors.textFaint} />}
                  right={
                    query ? (
                      <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color={colors.textFaint} />
                      </Pressable>
                    ) : undefined
                  }
                  testID="search-field"
                />
              </View>
            ) : (
              <View style={{ height: spacing.lg }} />
            )}
            {usedCategories.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
                <Chip label="All" selected={categoryId === null} onPress={() => setCategoryId(null)} />
                {usedCategories.map((c) => (
                  <Chip
                    key={c.id}
                    label={`${c.emoji} ${c.name}`}
                    selected={categoryId === c.id}
                    color={c.color}
                    onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <AppText variant="small" tone="muted" style={{ marginTop: spacing.md, marginBottom: spacing.xs, marginLeft: spacing.xs }}>
            {section.title.toUpperCase()} · {section.data.length}
          </AppText>
        )}
        renderItem={({ item, index, section }) => (
          <Card padded={false} style={index === 0 ? styles.cardTop : index === section.data.length - 1 ? styles.cardBottom : styles.cardMiddle}>
            <SubscriptionRow
              subscription={item}
              category={findCategory(categories, item.categoryId)}
              today={today}
              locale={languageTag}
              onPress={() => router.push({ pathname: '/subscription/[id]', params: { id: item.id } })}
              last
            />
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ marginTop: spacing.xl }}>
            <EmptyState emoji="🔍" title="Nothing matches" body="Try a different search or clear the category filter." />
          </View>
        }
      />
      <FAB onPress={onAdd} testID="add-fab" />
      <OptionSheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Sort by"
        options={SORT_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
        value={settings.sortBy}
        onSelect={(sortBy) => updateSettings({ sortBy })}
        testID="sort-sheet"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  cardTop: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
  cardMiddle: { borderRadius: 0, borderBottomWidth: 0 },
  cardBottom: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
});
