import { buildNotificationPlan } from '@/lib/notificationPlan';
import { useStore } from '@/store/useStore';

import { syncScheduledNotifications } from './notifications';

let timer: ReturnType<typeof setTimeout> | null = null;
let lastSignature = '';

function signature(): string {
  const { subscriptions, settings } = useStore.getState();
  const subs = subscriptions
    .map((s) => `${s.id}:${s.status}:${s.reminderDaysBefore}:${s.firstBillDate}:${s.cycle.every}${s.cycle.unit}:${s.trialEndDate}:${s.name}:${s.price}:${s.kind}:${s.autopay}:${s.amountVaries}:${s.paidThrough}:${s.createdAt}`)
    .join('|');
  return `${settings.notificationsEnabled}:${settings.reminderHour}:${subs}`;
}

/** Recomputes and reschedules reminders shortly after any relevant change. */
export function scheduleReminderSync(locale: string, delayMs = 800): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    const sig = signature();
    if (sig === lastSignature) return;
    lastSignature = sig;
    const { subscriptions, settings } = useStore.getState();
    const plan = buildNotificationPlan(subscriptions, settings, new Date(), locale);
    void syncScheduledNotifications(plan);
  }, delayMs);
}

/** Subscribes to the store for the lifetime of the app. Returns the unsubscribe function. */
export function startReminderSync(locale: string): () => void {
  scheduleReminderSync(locale, 1500);
  return useStore.subscribe(() => scheduleReminderSync(locale));
}
