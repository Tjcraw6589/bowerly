import type { PlannedNotification } from '@/lib/notificationPlan';

export const CHANNEL_ID = 'renewals';
export type PermissionState = 'granted' | 'denied' | 'undetermined';

// The web build is used for previews and the end-to-end test; scheduled local
// notifications are a native capability, so every call here is a no-op.
export function installNotificationHandler(): void {}

export async function ensureNotificationChannel(): Promise<void> {}

export async function getNotificationPermission(): Promise<PermissionState> {
  return 'denied';
}

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function syncScheduledNotifications(_plan: readonly PlannedNotification[]): Promise<number> {
  return 0;
}

export async function cancelAllReminders(): Promise<void> {}

export const notificationsSupported = false;
