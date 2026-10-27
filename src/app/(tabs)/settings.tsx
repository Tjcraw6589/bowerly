import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Notice } from '@/components/Notice';
import { OptionSheet } from '@/components/OptionSheet';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sheet } from '@/components/Sheet';
import { APP_VERSION, SUPPORT_EMAIL } from '@/config/monetization';
import { useLocale } from '@/hooks/useLocale';
import { useProGate } from '@/hooks/useProGate';
import { useToday } from '@/hooks/useToday';
import { CURRENCIES, currencyInfo } from '@/lib/currencies';
import { parseSubscriptionsCSV, subscriptionsToCSV, type ImportResult } from '@/lib/csv';
import { formatTimeOfDay } from '@/lib/dates';
import { newId } from '@/lib/ids';
import type { ThemePreference } from '@/lib/types';
import { exportCSVFile, pickCSVFile } from '@/services/exportImport';
import { cancelAllReminders, notificationsSupported, requestNotificationPermission } from '@/services/notifications';
import { purchasesSupported, restorePro, usePurchasesStatus } from '@/services/purchases';
import { storePageUrl } from '@/services/review';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

const THEMES: readonly { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

type Feedback = { tone: 'info' | 'success' | 'warning' | 'danger'; message: string } | null;

export default function SettingsScreen() {
  const router = useRouter();
  const today = useToday();
  const { languageTag } = useLocale();
  const { colors, spacing } = useTheme();
  const { isPro, gate } = useProGate();
  const settings = useStore((s) => s.settings);
  const subs = useStore((s) => s.subscriptions);
  const categories = useStore((s) => s.categories);
  const updateSettings = useStore((s) => s.updateSettings);
  const importSubscriptions = useStore((s) => s.importSubscriptions);
  const resetAll = useStore((s) => s.resetAll);
  const setPro = useStore((s) => s.setPro);
  const storeStatus = usePurchasesStatus();

  const [sheet, setSheet] = useState<null | 'currency' | 'hour' | 'reset'>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importSummary, setImportSummary] = useState<{ imported: number; skippedForLimit: number } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState<null | 'restore' | 'export' | 'import'>(null);

  const currencyOptions = useMemo(
    () => CURRENCIES.map((c) => ({ key: c.code, label: `${c.code} · ${c.name}`, sublabel: c.symbol })),
    [],
  );
  const hourOptions = useMemo(
    () => Array.from({ length: 24 }, (_, h) => ({ key: String(h), label: formatTimeOfDay(h, languageTag) })),
    [languageTag],
  );
  const rateUrl = storePageUrl();

  const toggleNotifications = async (next: boolean) => {
    if (!next) {
      updateSettings({ notificationsEnabled: false });
      await cancelAllReminders();
      return;
    }
    const granted = await requestNotificationPermission();
    if (granted) {
      updateSettings({ notificationsEnabled: true });
      setFeedback({ tone: 'success', message: 'Reminders are on. You can change the time below.' });
    } else {
      setFeedback({ tone: 'warning', message: 'Notifications are turned off for Billnest in your system settings.' });
      if (Platform.OS !== 'web') Linking.openSettings().catch(() => undefined);
    }
  };

  const restore = async () => {
    setBusy('restore');
    const outcome = await restorePro();
    setBusy(null);
    if (outcome === 'restored') {
      setPro(true);
      setFeedback({ tone: 'success', message: 'Pro restored. Thank you!' });
    } else if (outcome === 'none') {
      setFeedback({ tone: 'info', message: 'No previous Pro purchase was found for this store account.' });
    } else {
      setFeedback({ tone: 'warning', message: 'The store could not be reached. Check your connection and try again.' });
    }
  };

  const exportCSV = () =>
    gate('export', async () => {
      setBusy('export');
      const outcome = await exportCSVFile(subscriptionsToCSV(subs, categories));
      setBusy(null);
      setFeedback(
        outcome.ok
          ? { tone: 'success', message: outcome.shared ? 'Export ready.' : `Export saved to ${outcome.uri}` }
          : { tone: 'danger', message: outcome.message },
      );
    });

  const importCSV = () =>
    gate('import', async () => {
      setBusy('import');
      const picked = await pickCSVFile();
      setBusy(null);
      if (!picked.ok) {
        if (!picked.cancelled) setFeedback({ tone: 'danger', message: picked.message });
        return;
      }
      const result = parseSubscriptionsCSV(picked.text, categories, { currency: settings.currency, today, newCategoryId: newId });
      setImportResult(result);
      setImportSummary(null);
    });

  const confirmImport = () => {
    if (!importResult) return;
    const summary = importSubscriptions(importResult.drafts, importResult.newCategories);
    setImportSummary(summary);
  };

  const resetEverything = async () => {
    resetAll();
    await cancelAllReminders();
    setSheet(null);
    setFeedback({ tone: 'success', message: 'All subscriptions were deleted from this device.' });
  };

  return (
    <Screen scroll testID="settings-screen" footer={<AdBanner />}>
      <AppText variant="title" style={{ marginTop: spacing.md }}>
        Settings
      </AppText>

      {feedback ? (
        <View style={{ marginTop: spacing.md }}>
          <Notice tone={feedback.tone} message={feedback.message} actionLabel="Dismiss" onAction={() => setFeedback(null)} testID="settings-feedback" />
        </View>
      ) : null}

      <SectionHeader title="Billnest Pro" first={!feedback} />
      <Card testID="pro-card">
        {isPro ? (
          <View style={styles.proRow}>
            <Ionicons name="sparkles" size={22} color={colors.pro} style={{ marginRight: spacing.sm }} />
            <View style={styles.flex}>
              <AppText variant="bodyBold">Pro is unlocked</AppText>
              <AppText variant="caption" tone="muted">
                No ads, unlimited subscriptions, CSV export and import, custom categories and full insights. Thank you for supporting an
                independent app.
              </AppText>
            </View>
          </View>
        ) : (
          <>
            <AppText variant="bodyBold">Go Pro, once</AppText>
            <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
              One payment, yours forever. Removes ads and unlocks unlimited subscriptions, CSV export and import, custom categories and
              category and timeline insights.
            </AppText>
            <View style={[styles.buttons, { marginTop: spacing.md }]}>
              <Button label="See Pro" variant="pro" size="sm" onPress={() => router.push({ pathname: '/pro', params: { reason: 'general' } })} testID="see-pro" />
              {purchasesSupported ? (
                <Button
                  label="Restore purchases"
                  variant="ghost"
                  size="sm"
                  loading={busy === 'restore'}
                  disabled={storeStatus !== 'ready'}
                  onPress={() => void restore()}
                  testID="restore-purchases"
                />
              ) : null}
            </View>
          </>
        )}
      </Card>

      <SectionHeader title="General" />
      <Card padded={false}>
        <Row title="Currency" value={`${currencyInfo(settings.currency).symbol} ${settings.currency}`} onPress={() => setSheet('currency')} testID="settings-currency" />
        <View style={[styles.themeRow, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomColor: colors.border }]}>
          <AppText variant="body" style={{ marginBottom: spacing.sm }}>
            Appearance
          </AppText>
          <SegmentedControl options={THEMES} value={settings.theme} onChange={(theme) => updateSettings({ theme })} testID="theme" />
        </View>
        <Row
          title="Renewal reminders"
          subtitle={notificationsSupported ? 'Local notifications before renewals and trial ends' : 'Available in the iPhone and Android apps'}
          toggle={{ value: settings.notificationsEnabled, onValueChange: (v) => void toggleNotifications(v), disabled: !notificationsSupported }}
          testID="settings-notifications"
        />
        <Row
          title="Reminder time"
          value={formatTimeOfDay(settings.reminderHour, languageTag)}
          onPress={() => setSheet('hour')}
          last
          testID="settings-hour"
        />
      </Card>

      <SectionHeader title="Data" />
      <Card padded={false}>
        <Row
          title="Export to CSV"
          subtitle={isPro ? 'Share a spreadsheet of every subscription' : 'Pro feature'}
          right={busy === 'export' ? undefined : undefined}
          onPress={exportCSV}
          testID="settings-export"
        />
        <Row title="Import from CSV" subtitle={isPro ? 'Bring data in from a spreadsheet or another tracker' : 'Pro feature'} onPress={importCSV} testID="settings-import" />
        <Row
          title="Manage categories"
          subtitle={isPro ? 'Add, rename and recolour categories' : 'Pro feature'}
          onPress={() => gate('categories', () => router.push('/categories'))}
          testID="settings-categories"
        />
        <Row title="Delete all data" destructive chevron={false} onPress={() => setSheet('reset')} last testID="settings-reset" />
      </Card>

      <SectionHeader title="About" />
      <Card padded={false}>
        {rateUrl ? <Row title="Rate Billnest" subtitle="A review helps more than you'd think" onPress={() => void Linking.openURL(rateUrl)} /> : null}
        <Row title="Privacy policy" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacy' } })} testID="settings-privacy" />
        <Row title="Terms of use" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })} testID="settings-terms" />
        <Row
          title="Contact support"
          subtitle={SUPPORT_EMAIL}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Billnest%20${APP_VERSION}`)}
        />
        <Row title="Version" value={APP_VERSION} chevron={false} last />
      </Card>
      <AppText variant="caption" tone="faint" align="center" style={{ marginTop: spacing.xl }}>
        Your data never leaves this device unless you export it.
      </AppText>

      <OptionSheet
        visible={sheet === 'currency'}
        onClose={() => setSheet(null)}
        title="Primary currency"
        options={currencyOptions}
        value={settings.currency}
        onSelect={(currency) => updateSettings({ currency })}
        searchable
        testID="currency-sheet"
      />
      <OptionSheet
        visible={sheet === 'hour'}
        onClose={() => setSheet(null)}
        title="Reminder time"
        options={hourOptions}
        value={String(settings.reminderHour)}
        onSelect={(h) => updateSettings({ reminderHour: Number(h) })}
        testID="hour-sheet"
      />
      <ConfirmSheet
        visible={sheet === 'reset'}
        title="Delete all data?"
        message={`This removes all ${subs.length} subscriptions and any custom categories from this device. Your settings and Pro status stay. This cannot be undone.`}
        confirmLabel="Delete everything"
        destructive
        onConfirm={() => void resetEverything()}
        onCancel={() => setSheet(null)}
        testID="reset-sheet"
      />
      <Sheet visible={importResult !== null} onClose={() => setImportResult(null)} title="Import from CSV" testID="import-sheet">
        {importResult ? (
          <View style={{ paddingHorizontal: spacing.lg }}>
            {importSummary ? (
              <>
                <Notice
                  tone="success"
                  message={`${importSummary.imported} subscription${importSummary.imported === 1 ? '' : 's'} imported${
                    importSummary.skippedForLimit > 0 ? `, ${importSummary.skippedForLimit} skipped because of the free limit` : ''
                  }.`}
                />
                <Button label="Done" fullWidth onPress={() => setImportResult(null)} style={{ marginTop: spacing.lg }} />
              </>
            ) : (
              <>
                <AppText variant="body">
                  {importResult.drafts.length} subscription{importResult.drafts.length === 1 ? '' : 's'} ready to import
                  {importResult.newCategories.length > 0 ? `, creating ${importResult.newCategories.length} new categor${importResult.newCategories.length === 1 ? 'y' : 'ies'}` : ''}
                  .
                </AppText>
                {importResult.errors.length > 0 ? (
                  <View style={{ marginTop: spacing.md }}>
                    <AppText variant="caption" tone="warning">
                      {importResult.errors.length} row{importResult.errors.length === 1 ? '' : 's'} will be skipped:
                    </AppText>
                    {importResult.errors.slice(0, 6).map((e) => (
                      <AppText key={`${e.row}-${e.message}`} variant="caption" tone="muted">
                        Row {e.row}: {e.message}
                      </AppText>
                    ))}
                    {importResult.errors.length > 6 ? (
                      <AppText variant="caption" tone="muted">
                        …and {importResult.errors.length - 6} more
                      </AppText>
                    ) : null}
                  </View>
                ) : null}
                <Button
                  label={importResult.drafts.length > 0 ? `Import ${importResult.drafts.length}` : 'Nothing to import'}
                  fullWidth
                  disabled={importResult.drafts.length === 0}
                  onPress={confirmImport}
                  style={{ marginTop: spacing.lg }}
                  testID="import-confirm"
                />
                <Button label="Cancel" variant="ghost" fullWidth onPress={() => setImportResult(null)} style={{ marginTop: spacing.sm }} />
              </>
            )}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  proRow: { flexDirection: 'row', alignItems: 'flex-start' },
  buttons: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  themeRow: { borderBottomWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1 },
});
