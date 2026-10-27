import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { NestMark } from '@/components/NestMark';
import { OptionSheet } from '@/components/OptionSheet';
import { Screen } from '@/components/Screen';
import { useLocale } from '@/hooks/useLocale';
import { CURRENCIES, currencyInfo } from '@/lib/currencies';
import { formatTimeOfDay } from '@/lib/dates';
import { notificationsSupported, requestNotificationPermission } from '@/services/notifications';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

const QUICK_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'BRL'];
const REMINDER_HOURS = [8, 9, 12, 18, 20];
const STEP_COUNT = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { languageTag } = useLocale();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const currencyOptions = useMemo(
    () => CURRENCIES.map((c) => ({ key: c.code, label: `${c.code} · ${c.name}`, sublabel: c.symbol })),
    [],
  );
  const quickCurrencies = useMemo(() => {
    const list = [...QUICK_CURRENCIES];
    if (!list.includes(settings.currency)) list.unshift(settings.currency);
    return list.slice(0, 8);
  }, [settings.currency]);

  const finish = () => {
    completeOnboarding();
    router.replace('/');
  };

  const enableReminders = async () => {
    setRequesting(true);
    const granted = await requestNotificationPermission();
    setRequesting(false);
    if (granted) {
      updateSettings({ notificationsEnabled: true });
      finish();
    } else {
      setPermissionDenied(true);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} testID="onboarding">
      <View style={[styles.topBar, { marginTop: spacing.sm }]}>
        <View style={styles.dots}>
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? colors.primary : colors.border, width: i === step ? 22 : 8 },
              ]}
            />
          ))}
        </View>
        {step < STEP_COUNT - 1 ? (
          <Pressable accessibilityRole="button" onPress={finish} hitSlop={12} testID="onboarding-skip">
            <AppText variant="bodyBold" tone="muted">
              Skip
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {step === 0 ? (
        <View style={styles.body}>
          <NestMark size={96} />
          <AppText variant="title" style={{ marginTop: spacing.xl }}>
            Every subscription, one nest.
          </AppText>
          <AppText variant="body" tone="muted" style={{ marginTop: spacing.sm }}>
            See exactly what you pay each month and year, and get a nudge before anything renews.
          </AppText>
          <View style={{ marginTop: spacing.xl }}>
            <Feature icon="phone-portrait-outline" text="Works offline. Everything stays on your device." />
            <Feature icon="lock-closed-outline" text="No account, no bank link, no tracking of your data." />
            <Feature icon="notifications-outline" text="Reminders before renewals and before free trials end." />
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.body}>
          <AppText variant="title">Which currency do you mostly pay in?</AppText>
          <AppText variant="body" tone="muted" style={{ marginTop: spacing.sm }}>
            You can still add subscriptions in any other currency later.
          </AppText>
          <View style={[styles.chips, { marginTop: spacing.xl }]}>
            {quickCurrencies.map((code) => (
              <Chip
                key={code}
                label={`${currencyInfo(code).symbol} ${code}`}
                selected={settings.currency === code}
                onPress={() => updateSettings({ currency: code })}
                testID={`currency-chip-${code}`}
              />
            ))}
            <Chip label="More…" onPress={() => setCurrencyOpen(true)} testID="currency-more" />
          </View>
          <OptionSheet
            visible={currencyOpen}
            onClose={() => setCurrencyOpen(false)}
            title="Choose a currency"
            options={currencyOptions}
            value={settings.currency}
            onSelect={(code) => updateSettings({ currency: code })}
            searchable
            testID="currency-sheet"
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.body}>
          <AppText variant="title">Never miss a renewal</AppText>
          <AppText variant="body" tone="muted" style={{ marginTop: spacing.sm }}>
            Billnest can remind you a few days before each charge and before a free trial turns into a paid plan. Reminders are
            scheduled on your device; nothing is sent anywhere.
          </AppText>
          <AppText variant="small" tone="muted" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
            Remind me at
          </AppText>
          <View style={styles.chips}>
            {REMINDER_HOURS.map((h) => (
              <Chip
                key={h}
                label={formatTimeOfDay(h, languageTag)}
                selected={settings.reminderHour === h}
                onPress={() => updateSettings({ reminderHour: h })}
                testID={`hour-chip-${h}`}
              />
            ))}
          </View>
          {!notificationsSupported ? (
            <AppText variant="caption" tone="muted" style={{ marginTop: spacing.md }}>
              Reminders are available in the iPhone and Android apps.
            </AppText>
          ) : null}
          {permissionDenied ? (
            <AppText variant="caption" tone="warning" style={{ marginTop: spacing.md }}>
              Notifications are off for Billnest. You can turn them on any time from Settings.
            </AppText>
          ) : null}
        </View>
      ) : null}

      <View style={{ paddingBottom: spacing.lg }}>
        {step === 0 ? <Button label="Get started" size="lg" fullWidth onPress={() => setStep(1)} testID="onboarding-next" /> : null}
        {step === 1 ? <Button label="Continue" size="lg" fullWidth onPress={() => setStep(2)} testID="onboarding-next" /> : null}
        {step === 2 ? (
          <>
            <Button
              label={permissionDenied ? 'Finish' : 'Turn on reminders'}
              size="lg"
              fullWidth
              loading={requesting}
              disabled={!notificationsSupported && !permissionDenied}
              onPress={permissionDenied ? finish : () => void enableReminders()}
              testID="onboarding-enable-reminders"
            />
            <Button label="Maybe later" variant="ghost" fullWidth onPress={finish} style={{ marginTop: spacing.sm }} testID="onboarding-finish" />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function Feature({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={[styles.feature, { marginBottom: spacing.md }]}>
      <View style={[styles.featureIcon, { backgroundColor: colors.primarySoft, borderRadius: radius.md }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <AppText variant="body" style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 32 },
  dots: { flexDirection: 'row', alignItems: 'center' },
  dot: { height: 8, borderRadius: 4, marginRight: 6 },
  body: { flex: 1, justifyContent: 'center' },
  feature: { flexDirection: 'row', alignItems: 'center' },
  featureIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  flex: { flex: 1 },
});
