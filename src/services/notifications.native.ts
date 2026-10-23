import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import type { PlannedNotification } from '@/lib/notificationPlan';

export const CHANNEL_ID = 'renewals';
export type PermissionState = 'granted' | 'denied' | 'undetermined';

let handlerInstalled = false;

/** Shows reminders as banners even while the app is in the foreground. Safe to call repeatedly. */
export function installNotificationHandler(): void {
  if (handlerInstalled) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Renewal reminders',
    description: 'Reminders before a subscription renews or a free trial ends.',
    importance: AndroidImportance.HIGH,
  });
}

export async function getNotificationPermission(): Promise<PermissionState> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'denied';
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await ensureNotificationChannel();
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Replaces every pending reminder with the given plan. Replacing (rather than
 * diffing) keeps the OS state identical to the plan after any edit, including a
 * change of reminder hour, and the plan is capped well under the iOS limit.
 */
export async function syncScheduledNotifications(plan: readonly PlannedNotification[]): Promise<number> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (plan.length === 0) return 0;
    await ensureNotificationChannel();
    let scheduled = 0;
    for (const item of plan) {
      await Notifications.scheduleNotificationAsync({
        identifier: item.key,
        content: {
          title: item.title,
          body: item.body,
          data: { subscriptionId: item.subscriptionId },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.fireAt,
          channelId: CHANNEL_ID,
        },
      });
      scheduled += 1;
    }
    return scheduled;
  } catch {
    return 0;
  }
}

export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing to cancel, or the module is unavailable.
  }
}

export const notificationsSupported = true;
