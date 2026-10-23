import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { IS_EXPO_GO } from '@/config/monetization';
import { useLocale } from '@/hooks/useLocale';
import { initializeAds } from '@/services/ads';
import { installNotificationHandler } from '@/services/notifications';
import { configurePurchases } from '@/services/purchases';
import { startReminderSync } from '@/services/reminderSync';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
if (!IS_EXPO_GO) SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout() {
  const hydrated = useStore((s) => s.hydrated);
  const onboardingComplete = useStore((s) => s.settings.onboardingComplete);
  const isPro = useStore((s) => s.meta.isPro);
  const theme = useTheme();
  const locale = useLocale();

  useEffect(() => {
    if (hydrated) SplashScreen.hide();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const store = useStore.getState();
    store.recordSession();
    installNotificationHandler();
    const stopReminderSync = startReminderSync(locale.languageTag);
    void configurePurchases((pro) => useStore.getState().setPro(pro));
    return stopReminderSync;
  }, [hydrated, locale.languageTag]);

  useEffect(() => {
    // Ads (and the consent form that may precede them) are only ever started after onboarding.
    if (hydrated && onboardingComplete && !isPro) void initializeAds(isPro);
  }, [hydrated, onboardingComplete, isPro]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => undefined);
  }, [theme.colors.background]);

  if (!hydrated) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Protected guard={!onboardingComplete}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={onboardingComplete}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="editor" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="pro" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="subscription/[id]" />
          <Stack.Screen name="categories" />
        </Stack.Protected>
        <Stack.Screen name="legal/[doc]" />
      </Stack>
    </SafeAreaProvider>
  );
}
