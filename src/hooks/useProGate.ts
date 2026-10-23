import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useStore } from '@/store/useStore';

export type ProReason = 'limit' | 'export' | 'import' | 'categories' | 'insights' | 'general';

/** Returns a function that runs `action` for Pro users and opens the Pro screen for everyone else. */
export function useProGate() {
  const isPro = useStore((s) => s.meta.isPro);
  const router = useRouter();
  const gate = useCallback(
    (reason: ProReason, action: () => void) => {
      if (isPro) action();
      else router.push({ pathname: '/pro', params: { reason } });
    },
    [isPro, router],
  );
  return { isPro, gate };
}
