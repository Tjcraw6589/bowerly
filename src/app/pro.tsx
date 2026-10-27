import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { FREE_ACTIVE_LIMIT } from '@/lib/limits';
import { successHaptic } from '@/services/haptics';
import {
  billingStoreName,
  fetchProOffer,
  type ProOffer,
  purchasePro,
  purchasesSupported,
  restorePro,
  storeAccountName,
  usePurchasesStatus,
} from '@/services/purchases';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

const HEADLINES: Record<string, { title: string; body: string }> = {
  limit: {
    title: 'You have outgrown the free plan',
    body: `Free Billnest tracks up to ${FREE_ACTIVE_LIMIT} active subscriptions. Pro removes the limit for good.`,
  },
  export: { title: 'Take your data anywhere', body: 'Export every subscription to a CSV you can open in any spreadsheet.' },
  import: { title: 'Bring your data in', body: 'Import subscriptions from a spreadsheet or another tracker in seconds.' },
  categories: { title: 'Organise it your way', body: 'Create, rename and recolour categories to match how you think about your spending.' },
  insights: { title: 'See the full picture', body: 'Category breakdowns and a 12-month timeline show exactly where your money goes.' },
  general: { title: 'Billnest Pro', body: 'One payment. No subscription to track your subscriptions.' },
};

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'eye-off-outline', title: 'No ads', body: 'The banner disappears everywhere, forever.' },
  { icon: 'infinite-outline', title: 'Unlimited subscriptions', body: `Track as many as you like instead of ${FREE_ACTIVE_LIMIT}.` },
  { icon: 'pie-chart-outline', title: 'Full insights', body: 'Spend by category and a month-by-month projection.' },
  { icon: 'pricetags-outline', title: 'Custom categories', body: 'Add your own, with their own emoji and colour.' },
  { icon: 'document-text-outline', title: 'CSV export and import', body: 'Your data in a spreadsheet, in and out.' },
  { icon: 'heart-outline', title: 'Support an indie app', body: 'One developer, no venture funding, no data selling.' },
];

export default function ProScreen() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const isPro = useStore((s) => s.meta.isPro);
  const setPro = useStore((s) => s.setPro);
  const storeStatus = usePurchasesStatus();
  const [offer, setOffer] = useState<ProOffer | null>(null);
  const [busy, setBusy] = useState<null | 'buy' | 'restore'>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'warning' | 'info'; text: string } | null>(null);
  const headline = HEADLINES[reason ?? 'general'] ?? HEADLINES.general!;

  useEffect(() => {
    let cancelled = false;
    if (storeStatus === 'ready') {
      fetchProOffer().then((o) => {
        if (!cancelled) setOffer(o);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [storeStatus]);

  const buy = async () => {
    setBusy('buy');
    const outcome = await purchasePro();
    setBusy(null);
    if (outcome === 'purchased') {
      setPro(true);
      successHaptic();
      setMessage({ tone: 'success', text: 'Pro is unlocked. Thank you!' });
    } else if (outcome === 'cancelled') {
      setMessage({ tone: 'info', text: 'No problem. The free version keeps working.' });
    } else {
      setMessage({ tone: 'warning', text: 'The purchase could not be completed. You were not charged.' });
    }
  };

  const restore = async () => {
    setBusy('restore');
    const outcome = await restorePro();
    setBusy(null);
    if (outcome === 'restored') {
      setPro(true);
      successHaptic();
      setMessage({ tone: 'success', text: 'Pro restored. Thank you!' });
    } else if (outcome === 'none') {
      setMessage({ tone: 'info', text: 'No previous Pro purchase was found for this store account.' });
    } else {
      setMessage({ tone: 'warning', text: 'The store could not be reached. Check your connection and try again.' });
    }
  };

  // Opened directly (deep link, web reload) there is no history to go back to.
  const dismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const storeReady = storeStatus === 'ready' && offer !== null;
  const unavailableText = !purchasesSupported
    ? 'In-app purchases are available in the iPhone and Android apps. Everything in the free version works here.'
    : storeStatus === 'loading'
      ? 'Connecting to the store…'
      : 'The store is unavailable right now. The free version keeps working, and you can try again later.';

  return (
    <Screen scroll edges={['top', 'bottom']} testID="pro-screen">
      <Header title="" dismiss="close" />
      <View style={styles.hero}>
        <View style={[styles.badge, { backgroundColor: colors.proSoft, borderRadius: radius.xl }]}>
          <Text style={styles.badgeEmoji}>✨</Text>
        </View>
        <AppText variant="title" align="center" style={{ marginTop: spacing.lg }}>
          {headline.title}
        </AppText>
        <AppText variant="body" tone="muted" align="center" style={{ marginTop: spacing.sm }}>
          {headline.body}
        </AppText>
      </View>

      {message ? (
        <View style={{ marginTop: spacing.lg }}>
          <Notice tone={message.tone} message={message.text} testID="pro-message" />
        </View>
      ) : null}

      <Card style={{ marginTop: spacing.xl }} padded={false}>
        {FEATURES.map((f, i) => (
          <View
            key={f.title}
            style={[
              styles.feature,
              { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
              i < FEATURES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
            ]}
          >
            <View style={[styles.featureIcon, { backgroundColor: colors.proSoft, borderRadius: radius.md }]}>
              <Ionicons name={f.icon} size={20} color={colors.pro} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyBold">{f.title}</AppText>
              <AppText variant="caption" tone="muted">
                {f.body}
              </AppText>
            </View>
          </View>
        ))}
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        {isPro ? (
          <>
            <Notice tone="success" title="You have Pro" message="Every feature above is unlocked on this device." />
            <Button label="Done" fullWidth size="lg" onPress={dismiss} style={{ marginTop: spacing.lg }} testID="pro-done" />
          </>
        ) : (
          <>
            {!storeReady ? <Notice tone="info" message={unavailableText} testID="store-unavailable" /> : null}
            <Button
              label={storeReady ? `Unlock Pro for ${offer.priceString}` : 'Unlock Pro'}
              variant="pro"
              size="lg"
              fullWidth
              disabled={!storeReady}
              loading={busy === 'buy'}
              onPress={() => void buy()}
              style={{ marginTop: spacing.lg }}
              testID="pro-buy"
            />
            <AppText variant="caption" tone="faint" align="center" style={{ marginTop: spacing.sm }}>
              One-time purchase. Not a subscription. Billed by {billingStoreName()}; restore on any device signed in to the same {storeAccountName()}.
            </AppText>
            <Button
              label="Restore purchases"
              variant="ghost"
              fullWidth
              disabled={storeStatus !== 'ready'}
              loading={busy === 'restore'}
              onPress={() => void restore()}
              style={{ marginTop: spacing.sm }}
              testID="pro-restore"
            />
            <Button label="Not now" variant="ghost" fullWidth onPress={dismiss} testID="pro-not-now" />
          </>
        )}
      </View>
      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center' },
  badge: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  badgeEmoji: { fontSize: 44, lineHeight: 54 },
  feature: { flexDirection: 'row', alignItems: 'center' },
  featureIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  flex: { flex: 1 },
});
