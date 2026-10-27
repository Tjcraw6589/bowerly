import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { BUILT_IN_CATEGORIES, mergeBuiltInCategories, OTHER_CATEGORY_ID } from '@/lib/categories';
import { newId } from '@/lib/ids';
import { canAddActiveSubscription } from '@/lib/limits';
import { detectDeviceLocale } from '@/lib/locale';
import { paidThroughAfterMarking, paidThroughAfterUndo } from '@/lib/payments';
import type { Category, Meta, Settings, Subscription, SubscriptionDraft, SubscriptionStatus } from '@/lib/types';

/** Internal storage key; never shown to users and kept stable so saved data survives renames. */
export const STORAGE_KEY = 'subtally-store';
export const STORE_VERSION = 2;

interface PersistedState {
  subscriptions?: Partial<Subscription>[];
  categories?: Category[];
  settings?: Settings;
  meta?: Meta;
}

/**
 * Upgrades saved data from older app versions.
 * v1 -> v2: items gain kind/autopay/amountVaries/paidThrough (existing items were all
 * subscriptions), and the new bill categories are added.
 */
export function migrateState(persisted: unknown, fromVersion: number): PersistedState {
  const state = (persisted ?? {}) as PersistedState;
  if (fromVersion < 2) {
    state.subscriptions = (state.subscriptions ?? []).map((s) => ({
      kind: 'subscription',
      autopay: true,
      amountVaries: false,
      paidThrough: null,
      ...s,
    }));
    state.categories = mergeBuiltInCategories(state.categories ?? [...BUILT_IN_CATEGORIES]);
  }
  return state;
}

export function createDefaultSettings(currency: string): Settings {
  return {
    currency,
    theme: 'system',
    reminderHour: 9,
    notificationsEnabled: false,
    onboardingComplete: false,
    summaryPeriod: 'month',
    sortBy: 'nextBill',
  };
}

export function createDefaultMeta(now: Date): Meta {
  return {
    installedAt: now.toISOString(),
    sessionCount: 0,
    lastReviewPromptAt: null,
    reviewPromptCount: 0,
    isPro: false,
  };
}

export type AddResult = { ok: true; subscription: Subscription } | { ok: false; reason: 'limit' };

export interface ImportSummary {
  imported: number;
  skippedForLimit: number;
}

export interface StoreState {
  subscriptions: Subscription[];
  categories: Category[];
  settings: Settings;
  meta: Meta;
  hydrated: boolean;

  addSubscription: (draft: SubscriptionDraft) => AddResult;
  updateSubscription: (id: string, patch: Partial<SubscriptionDraft>) => void;
  removeSubscription: (id: string) => void;
  setSubscriptionStatus: (id: string, status: SubscriptionStatus) => AddResult | void;
  /** Manual bills: marks the next unpaid due date (oldest overdue first) as paid. */
  markPaid: (id: string, today: Date) => void;
  /** Manual bills: undoes the most recent "mark paid". */
  undoPaid: (id: string) => void;

  addCategory: (input: Omit<Category, 'id' | 'builtIn'>) => Category;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id' | 'builtIn'>>) => void;
  removeCategory: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  completeOnboarding: () => void;
  recordSession: () => void;
  recordReviewPrompt: (now: Date) => void;
  setPro: (isPro: boolean) => void;
  importSubscriptions: (drafts: readonly SubscriptionDraft[], newCategories: readonly Category[]) => ImportSummary;
  resetAll: () => void;
  setHydrated: (hydrated: boolean) => void;
}

function nowISO(): string {
  return new Date().toISOString();
}

function activeCount(subs: readonly Subscription[]): number {
  return subs.filter((s) => s.status === 'active').length;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      categories: [...BUILT_IN_CATEGORIES],
      settings: createDefaultSettings(detectDeviceLocale().currency),
      meta: createDefaultMeta(new Date()),
      hydrated: false,

      addSubscription: (draft) => {
        const state = get();
        if (draft.status === 'active' && !canAddActiveSubscription(activeCount(state.subscriptions), state.meta.isPro)) {
          return { ok: false, reason: 'limit' };
        }
        const stamp = nowISO();
        const subscription: Subscription = {
          ...draft,
          name: draft.name.trim(),
          notes: draft.notes.trim(),
          id: newId(),
          createdAt: stamp,
          updatedAt: stamp,
        };
        set({ subscriptions: [...state.subscriptions, subscription] });
        return { ok: true, subscription };
      },

      updateSubscription: (id, patch) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...patch,
                  name: (patch.name ?? s.name).trim(),
                  notes: (patch.notes ?? s.notes).trim(),
                  updatedAt: nowISO(),
                }
              : s,
          ),
        }));
      },

      removeSubscription: (id) => {
        set((state) => ({ subscriptions: state.subscriptions.filter((s) => s.id !== id) }));
      },

      setSubscriptionStatus: (id, status) => {
        const state = get();
        const target = state.subscriptions.find((s) => s.id === id);
        if (!target || target.status === status) return;
        if (
          status === 'active' &&
          !canAddActiveSubscription(activeCount(state.subscriptions), state.meta.isPro)
        ) {
          return { ok: false, reason: 'limit' };
        }
        const stamp = nowISO();
        set({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status,
                  cancelledAt: status === 'cancelled' ? stamp : null,
                  updatedAt: stamp,
                }
              : s,
          ),
        });
        return;
      },

      markPaid: (id, today) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id && s.kind === 'bill' && !s.autopay
              ? { ...s, paidThrough: paidThroughAfterMarking(s, today), updatedAt: nowISO() }
              : s,
          ),
        }));
      },

      undoPaid: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id && s.paidThrough ? { ...s, paidThrough: paidThroughAfterUndo(s), updatedAt: nowISO() } : s,
          ),
        }));
      },

      addCategory: (input) => {
        const category: Category = { ...input, name: input.name.trim(), id: newId(), builtIn: false };
        set((state) => ({ categories: [...state.categories, category] }));
        return category;
      },

      updateCategory: (id, patch) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...patch, name: (patch.name ?? c.name).trim() } : c,
          ),
        }));
      },

      removeCategory: (id) => {
        set((state) => {
          const target = state.categories.find((c) => c.id === id);
          if (!target || target.builtIn) return {};
          return {
            categories: state.categories.filter((c) => c.id !== id),
            subscriptions: state.subscriptions.map((s) =>
              s.categoryId === id ? { ...s, categoryId: OTHER_CATEGORY_ID, updatedAt: nowISO() } : s,
            ),
          };
        });
      },

      updateSettings: (patch) => {
        set((state) => ({ settings: { ...state.settings, ...patch } }));
      },

      completeOnboarding: () => {
        set((state) => ({ settings: { ...state.settings, onboardingComplete: true } }));
      },

      recordSession: () => {
        set((state) => ({ meta: { ...state.meta, sessionCount: state.meta.sessionCount + 1 } }));
      },

      recordReviewPrompt: (now) => {
        set((state) => ({
          meta: {
            ...state.meta,
            lastReviewPromptAt: now.toISOString(),
            reviewPromptCount: state.meta.reviewPromptCount + 1,
          },
        }));
      },

      setPro: (isPro) => {
        if (get().meta.isPro === isPro) return;
        set((state) => ({ meta: { ...state.meta, isPro } }));
      },

      importSubscriptions: (drafts, newCategories) => {
        const state = get();
        const categories = [...state.categories, ...newCategories.filter((c) => !state.categories.some((e) => e.id === c.id))];
        const subs = [...state.subscriptions];
        let imported = 0;
        let skippedForLimit = 0;
        const stamp = nowISO();
        for (const draft of drafts) {
          if (draft.status === 'active' && !canAddActiveSubscription(activeCount(subs), state.meta.isPro)) {
            skippedForLimit += 1;
            continue;
          }
          subs.push({ ...draft, id: newId(), createdAt: stamp, updatedAt: stamp });
          imported += 1;
        }
        set({ categories, subscriptions: subs });
        return { imported, skippedForLimit };
      },

      resetAll: () => {
        set({ subscriptions: [], categories: [...BUILT_IN_CATEGORIES] });
      },

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscriptions: state.subscriptions,
        categories: state.categories,
        settings: state.settings,
        meta: state.meta,
      }),
      onRehydrateStorage: () => () => {
        // Whether storage loaded or failed, the UI must render; a failure simply means defaults.
        useStore.setState({ hydrated: true });
      },
      migrate: (persisted, version) => migrateState(persisted, version) as unknown as StoreState,
    },
  ),
);

/** Convenience selectors. */
export const selectActiveCount = (s: StoreState): number => activeCount(s.subscriptions);
export const selectIsPro = (s: StoreState): boolean => s.meta.isPro;
