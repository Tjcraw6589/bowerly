import { useMemo } from 'react';

import { detectDeviceLocale, type DeviceLocale } from '@/lib/locale';

export function useLocale(): DeviceLocale {
  return useMemo(() => detectDeviceLocale(), []);
}
