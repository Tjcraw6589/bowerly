import { AppState } from 'react-native';

import { toISODate } from '@/lib/dates';
import { buildNotificationPlan } from '@/lib/notificationPlan';
import { useStore } from '@/store/useStore';

import { syncScheduledNotifications } from './notifications';

let timer: ReturnType<typeof setTimeout> | null = null;
let lastSignature = '';

function signature(now: Date): string {
  const { subscriptions, settings } = useStore.getState();
  const subs = subscriptions
    .map((s) => `${s.id}:${s.status}:${s.reminderDaysBefore}:${s.firstBillDate}:${s.cycle.every}${s.cycle.unit}:${s.trialEndDate}:${s.name}:${s.price}:${s.currency}:${s.kind}:${s.autopay}:${s.amountVaries}:${s.paidThrough}:${s.createdAt}`)
    .join('|');
  // The date is part of it: the plan only reaches 60 days ahead, so a new day must extend it even when nothing was edited.
  return `${toISODate(now)}:${settings.notificationsEnabled}:${settings.reminderHour}:${subs}`;
}

/** Recomputes and reschedules reminders shortly after any relevant change. */
export function scheduleReminderSync(locale: string, delayMs = 800): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    const now = new Date();
    const sig = signature(now);
    if (sig === lastSignature) return;
    lastSignature = sig;
    const { subscriptions, settings } = useStore.getState();
    const plan = buildNotificationPlan(subscriptions, settings, now, locale);
    void syncScheduledNotifications(plan);
  }, delayMs);
}

/**
 * Subscribes to the store, and to the app coming back to the foreground, for the lifetime of the app.
 * The foreground check matters because iOS can keep the app suspended for weeks without a cold start.
 * Returns the unsubscribe function.
 */
export function startReminderSync(locale: string): () => void {
  scheduleReminderSync(locale, 1500);
  const stopStore = useStore.subscribe(() => scheduleReminderSync(locale));
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') scheduleReminderSync(locale);
  });
  return () => {
    stopStore();
    appState.remove();
  };
}
