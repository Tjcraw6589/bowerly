import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { DateSheet } from '@/components/DateSheet';
import { Header } from '@/components/Header';
import { OptionSheet } from '@/components/OptionSheet';
import { ColorGrid, EmojiGrid } from '@/components/Pickers';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sheet } from '@/components/Sheet';
import { TextField } from '@/components/TextField';
import { useLocale } from '@/hooks/useLocale';
import { useToday } from '@/hooks/useToday';
import { CATEGORY_COLORS, findCategory, OTHER_CATEGORY_ID } from '@/lib/categories';
import { CURRENCIES, currencyInfo } from '@/lib/currencies';
import { addDays, formatDate, nextBillDate, parseISODate, toISODate } from '@/lib/dates';
import { CYCLE_PRESETS, cycleLabel, cyclesEqual, formatMoney, parsePriceInput } from '@/lib/money';
import { AVATAR_EMOJIS, searchPresets, type ServicePreset } from '@/lib/presets';
import type { BillingCycle, CycleUnit, Settings, Subscription, SubscriptionDraft } from '@/lib/types';
import { type DraftErrors, hasErrors, MAX_NAME_LENGTH, MAX_NOTES_LENGTH, validateDraft } from '@/lib/validation';
import { successHaptic, warningHaptic } from '@/services/haptics';
import { maybeRequestReview } from '@/services/review';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

const CYCLE_KEYS = [
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'quarter', label: 'Quarterly' },
  { key: 'year', label: 'Yearly' },
  { key: 'custom', label: 'Custom' },
] as const;
type CycleKey = (typeof CYCLE_KEYS)[number]['key'];

const UNIT_OPTIONS: readonly { key: CycleUnit; label: string }[] = [
  { key: 'day', label: 'days' },
  { key: 'week', label: 'weeks' },
  { key: 'month', label: 'months' },
  { key: 'year', label: 'years' },
];

const REMINDER_OPTIONS = [
  { key: 'none', label: 'No reminder' },
  { key: '0', label: 'On the day' },
  { key: '1', label: '1 day before' },
  { key: '3', label: '3 days before' },
  { key: '7', label: '7 days before' },
] as const;

function cycleKeyFor(cycle: BillingCycle): CycleKey {
  if (cyclesEqual(cycle, { every: 1, unit: 'week' })) return 'week';
  if (cyclesEqual(cycle, { every: 1, unit: 'month' })) return 'month';
  if (cyclesEqual(cycle, { every: 3, unit: 'month' })) return 'quarter';
  if (cyclesEqual(cycle, { every: 1, unit: 'year' })) return 'year';
  return 'custom';
}

function cycleForKey(key: Exclude<CycleKey, 'custom'>): BillingCycle {
  return { week: CYCLE_PRESETS[0]!.cycle, month: CYCLE_PRESETS[1]!.cycle, quarter: CYCLE_PRESETS[2]!.cycle, year: CYCLE_PRESETS[3]!.cycle }[key];
}

function defaultDraft(settings: Settings, today: Date): SubscriptionDraft {
  return {
    name: '',
    price: 0,
    currency: settings.currency,
    cycle: { every: 1, unit: 'month' },
    firstBillDate: toISODate(today),
    categoryId: OTHER_CATEGORY_ID,
    color: '#3D5AFE',
    emoji: '📦',
    notes: '',
    reminderDaysBefore: 1,
    status: 'active',
    trialEndDate: null,
    cancelledAt: null,
  };
}

function toDraft(s: Subscription): SubscriptionDraft {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = s;
  return rest;
}

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const today = useToday();
  const { languageTag, decimalSeparator } = useLocale();
  const { colors, spacing, radius } = useTheme();
  const existing = useStore((s) => s.subscriptions.find((x) => x.id === id));
  const categories = useStore((s) => s.categories);
  const settings = useStore((s) => s.settings);
  const addSubscription = useStore((s) => s.addSubscription);
  const updateSubscription = useStore((s) => s.updateSubscription);

  const [draft, setDraft] = useState<SubscriptionDraft>(() => (existing ? toDraft(existing) : defaultDraft(settings, today)));
  const [priceText, setPriceText] = useState(() => (existing ? existing.price.toFixed(2) : ''));
  const [cycleKey, setCycleKey] = useState<CycleKey>(() => (existing ? cycleKeyFor(existing.cycle) : 'month'));
  const [everyText, setEveryText] = useState(() => String(draft.cycle.every));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [presetDismissed, setPresetDismissed] = useState(Boolean(existing));
  const [sheet, setSheet] = useState<null | 'avatar' | 'currency' | 'category' | 'reminder' | 'firstDate' | 'trialDate'>(null);
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<SubscriptionDraft>) => setDraft((d) => ({ ...d, ...p }));

  const suggestions = useMemo(
    () => (presetDismissed || existing ? [] : searchPresets(draft.name).filter((p) => p.name.toLowerCase() !== draft.name.trim().toLowerCase())),
    [draft.name, presetDismissed, existing],
  );

  const applyPreset = (p: ServicePreset) => {
    setDraft((d) => ({ ...d, name: p.name, emoji: p.emoji, color: p.color, categoryId: p.categoryId, cycle: p.cycle }));
    setCycleKey(cycleKeyFor(p.cycle));
    setEveryText(String(p.cycle.every));
    setPresetDismissed(true);
  };

  const currentCycle: BillingCycle = useMemo(() => {
    if (cycleKey === 'custom') return { every: Math.max(1, Math.floor(Number(everyText) || 0)), unit: draft.cycle.unit };
    return cycleForKey(cycleKey);
  }, [cycleKey, everyText, draft.cycle.unit]);

  const firstDate = parseISODate(draft.firstBillDate) ?? today;
  const trialDate = draft.trialEndDate ? parseISODate(draft.trialEndDate) : null;
  const nextRenewal = nextBillDate(firstDate, currentCycle, today);
  const category = findCategory(categories, draft.categoryId);
  const priceValue = parsePriceInput(priceText, decimalSeparator);

  const setTrial = (on: boolean) => {
    if (!on) {
      patch({ trialEndDate: null });
      return;
    }
    const end = trialDate ?? addDays(today, 7);
    const first = parseISODate(draft.firstBillDate);
    patch({
      trialEndDate: toISODate(end),
      firstBillDate: first && first.getTime() > end.getTime() ? draft.firstBillDate : toISODate(addDays(end, 1)),
    });
  };

  const changeTrialDate = (end: Date) => {
    const first = parseISODate(draft.firstBillDate);
    patch({
      trialEndDate: toISODate(end),
      firstBillDate: first && first.getTime() > end.getTime() ? draft.firstBillDate : toISODate(addDays(end, 1)),
    });
  };

  const save = () => {
    const candidate: SubscriptionDraft = {
      ...draft,
      price: priceValue ?? Number.NaN,
      cycle: currentCycle,
      notes: draft.notes.slice(0, MAX_NOTES_LENGTH),
    };
    const errs = validateDraft(candidate);
    if (cycleKey === 'custom' && (!Number.isInteger(Number(everyText)) || Number(everyText) < 1)) errs.cycleEvery = 'Repeat every 1 to 365 units.';
    if (hasErrors(errs)) {
      setErrors(errs);
      warningHaptic();
      return;
    }
    setSaving(true);
    if (existing) {
      updateSubscription(existing.id, candidate);
    } else {
      const result = addSubscription(candidate);
      if (!result.ok) {
        setSaving(false);
        router.replace({ pathname: '/pro', params: { reason: 'limit' } });
        return;
      }
    }
    successHaptic();
    if (router.canGoBack()) router.back();
    else router.replace('/');
    setTimeout(() => void maybeRequestReview(true), 1500);
  };

  const currencyOptions = useMemo(
    () => CURRENCIES.map((c) => ({ key: c.code, label: `${c.code} · ${c.name}`, sublabel: c.symbol })),
    [],
  );
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ key: c.id, label: c.name, left: <Avatar emoji={c.emoji} color={c.color} size={32} /> })),
    [categories],
  );

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      testID="editor-screen"
      footer={
        <View style={[styles.footer, { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, backgroundColor: colors.background }]}>
          <Button label={existing ? 'Save changes' : 'Add subscription'} size="lg" fullWidth onPress={save} loading={saving} testID="editor-save" />
        </View>
      }
    >
      <Header title={existing ? 'Edit subscription' : 'New subscription'} dismiss="close" />

      <View style={[styles.avatarRow, { marginBottom: spacing.lg }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Change icon and colour" onPress={() => setSheet('avatar')} testID="avatar-button">
          <Avatar emoji={draft.emoji} color={draft.color} size={72} />
          <View style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Ionicons name="pencil" size={12} color={colors.onPrimary} />
          </View>
        </Pressable>
        <View style={[styles.flex, { marginLeft: spacing.lg }]}>
          <TextField
            label="Name"
            placeholder="Netflix, gym, rent…"
            value={draft.name}
            onChangeText={(name) => {
              patch({ name });
              if (presetDismissed && !existing) setPresetDismissed(false);
            }}
            maxLength={MAX_NAME_LENGTH}
            autoFocus={!existing}
            autoCapitalize="words"
            autoCorrect={false}
            error={errors.name}
            returnKeyType="next"
            testID="name-field"
          />
        </View>
      </View>
      {suggestions.length > 0 ? (
        <View style={[styles.suggestions, { marginTop: -spacing.sm, marginBottom: spacing.md }]}>
          {suggestions.map((p) => (
            <Chip key={p.name} label={`${p.emoji} ${p.name}`} onPress={() => applyPreset(p)} testID={`preset-${p.name}`} />
          ))}
        </View>
      ) : null}

      <TextField
        label="Price"
        placeholder="0.00"
        value={priceText}
        onChangeText={(t) => {
          setPriceText(t);
          if (errors.price) setErrors((e) => ({ ...e, price: undefined }));
        }}
        keyboardType="decimal-pad"
        inputMode="decimal"
        error={errors.price}
        left={
          <AppText variant="bodyBold" tone="muted">
            {currencyInfo(draft.currency).symbol}
          </AppText>
        }
        right={
          <Pressable accessibilityRole="button" accessibilityLabel="Change currency" onPress={() => setSheet('currency')} testID="currency-button">
            <View style={[styles.currencyPill, { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill }]}>
              <AppText variant="small">{draft.currency}</AppText>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </View>
          </Pressable>
        }
        testID="price-field"
      />

      <AppText variant="small" tone="muted" style={{ marginBottom: spacing.xs }}>
        Billing cycle
      </AppText>
      <SegmentedControl
        options={CYCLE_KEYS}
        value={cycleKey}
        onChange={(key) => {
          setCycleKey(key);
          if (key !== 'custom') patch({ cycle: cycleForKey(key) });
        }}
        testID="cycle"
      />
      {cycleKey === 'custom' ? (
        <View style={[styles.customRow, { marginTop: spacing.md }]}>
          <AppText variant="body" style={{ marginRight: spacing.sm }}>
            Every
          </AppText>
          <View style={{ width: 72 }}>
            <TextField
              value={everyText}
              onChangeText={setEveryText}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={3}
              error={errors.cycleEvery}
              testID="every-field"
            />
          </View>
          <View style={[styles.unitChips, { marginLeft: spacing.sm }]}>
            {UNIT_OPTIONS.map((u) => (
              <Chip key={u.key} label={u.label} selected={draft.cycle.unit === u.key} onPress={() => patch({ cycle: { ...draft.cycle, unit: u.key } })} />
            ))}
          </View>
        </View>
      ) : null}
      {priceValue !== null && priceValue > 0 ? (
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
          {formatMoney(priceValue, draft.currency, languageTag)} {cycleLabel(currentCycle).toLowerCase()}
        </AppText>
      ) : null}

      <Card padded={false} style={{ marginTop: spacing.lg }}>
        <Row
          title="Free trial"
          subtitle={trialDate ? `Ends ${formatDate(trialDate, languageTag)}` : 'Remind me before a trial turns into a paid plan'}
          toggle={{ value: draft.trialEndDate !== null, onValueChange: setTrial }}
          testID="trial-row"
        />
        {draft.trialEndDate !== null ? (
          <Row title="Trial ends" value={trialDate ? formatDate(trialDate, languageTag) : ''} onPress={() => setSheet('trialDate')} testID="trial-date-row" />
        ) : null}
        <Row
          title={draft.trialEndDate !== null ? 'First paid bill' : 'First bill date'}
          subtitle={errors.firstBillDate ?? (nextRenewal.getTime() !== firstDate.getTime() ? `Next renewal: ${formatDate(nextRenewal, languageTag)}` : undefined)}
          value={formatDate(firstDate, languageTag)}
          onPress={() => setSheet('firstDate')}
          testID="first-date-row"
        />
        <Row
          title="Category"
          value={`${category.emoji} ${category.name}`}
          onPress={() => setSheet('category')}
          testID="category-row"
        />
        <Row
          title="Reminder"
          value={REMINDER_OPTIONS.find((o) => o.key === String(draft.reminderDaysBefore ?? 'none'))?.label ?? 'No reminder'}
          onPress={() => setSheet('reminder')}
          last
          testID="reminder-row"
        />
      </Card>
      {errors.firstBillDate ? (
        <AppText variant="caption" tone="danger" style={{ marginTop: spacing.xs }}>
          {errors.firstBillDate}
        </AppText>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <TextField
          label="Notes"
          placeholder="Account email, plan tier, who shares it…"
          value={draft.notes}
          onChangeText={(notes) => patch({ notes })}
          multiline
          maxLength={MAX_NOTES_LENGTH}
          testID="notes-field"
        />
      </View>

      <Sheet visible={sheet === 'avatar'} onClose={() => setSheet(null)} title="Icon and colour" testID="avatar-sheet">
        <View style={{ paddingHorizontal: spacing.lg }}>
          <View style={[styles.previewRow, { marginBottom: spacing.md }]}>
            <Avatar emoji={draft.emoji} color={draft.color} size={56} />
          </View>
          <ColorGrid colors={CATEGORY_COLORS} value={draft.color} onChange={(color) => patch({ color })} />
          <View style={{ height: spacing.md }} />
          <EmojiGrid emojis={AVATAR_EMOJIS} value={draft.emoji} onChange={(emoji) => patch({ emoji })} />
          <Button label="Done" fullWidth onPress={() => setSheet(null)} style={{ marginTop: spacing.lg }} />
        </View>
      </Sheet>
      <OptionSheet
        visible={sheet === 'currency'}
        onClose={() => setSheet(null)}
        title="Currency"
        options={currencyOptions}
        value={draft.currency}
        onSelect={(currency) => patch({ currency })}
        searchable
        testID="currency-sheet"
      />
      <OptionSheet
        visible={sheet === 'category'}
        onClose={() => setSheet(null)}
        title="Category"
        options={categoryOptions}
        value={draft.categoryId}
        onSelect={(categoryId) => {
          const c = findCategory(categories, categoryId);
          setDraft((d) => ({ ...d, categoryId, color: d.color === '#3D5AFE' && d.emoji === '📦' ? c.color : d.color, emoji: d.emoji === '📦' ? c.emoji : d.emoji }));
        }}
        testID="category-sheet"
      />
      <OptionSheet
        visible={sheet === 'reminder'}
        onClose={() => setSheet(null)}
        title="Remind me"
        options={REMINDER_OPTIONS}
        value={String(draft.reminderDaysBefore ?? 'none')}
        onSelect={(key) => patch({ reminderDaysBefore: key === 'none' ? null : Number(key) })}
        testID="reminder-sheet"
      />
      <DateSheet
        visible={sheet === 'firstDate'}
        onClose={() => setSheet(null)}
        title={draft.trialEndDate !== null ? 'First paid bill' : 'First bill date'}
        value={firstDate}
        onChange={(d) => {
          patch({ firstBillDate: toISODate(d) });
          setErrors((e) => ({ ...e, firstBillDate: undefined }));
        }}
        locale={languageTag}
        testID="first-date-sheet"
      />
      <DateSheet
        visible={sheet === 'trialDate'}
        onClose={() => setSheet(null)}
        title="Trial ends"
        value={trialDate ?? addDays(today, 7)}
        onChange={changeTrialDate}
        locale={languageTag}
        testID="trial-date-sheet"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { paddingTop: 8 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-start' },
  editBadge: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap' },
  currencyPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
  customRow: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' },
  unitChips: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, paddingTop: 6 },
  previewRow: { alignItems: 'center' },
});
