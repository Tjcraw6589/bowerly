import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { startOfDay } from '@/lib/dates';

/** Today's date at local midnight, refreshed when the app returns to the foreground or the day rolls over. */
export function useToday(): Date {
  const [today, setToday] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    const refresh = () => {
      const next = startOfDay(new Date());
      setToday((prev) => (prev.getTime() === next.getTime() ? prev : next));
    };
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const now = new Date();
    const msUntilMidnight = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)).getTime() - now.getTime();
    const timer = setTimeout(refresh, msUntilMidnight + 1000);
    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, [today]);

  return today;
}
