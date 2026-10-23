import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface StatusPillProps {
  label: string;
  tone?: 'warning' | 'muted' | 'success' | 'danger' | 'pro' | 'primary';
}

export function StatusPill({ label, tone = 'muted' }: StatusPillProps) {
  const { colors, radius } = useTheme();
  const palette = {
    warning: { bg: colors.warningSoft, fg: colors.warning },
    muted: { bg: colors.surfaceAlt, fg: colors.textMuted },
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    pro: { bg: colors.proSoft, fg: colors.pro },
    primary: { bg: colors.primarySoft, fg: colors.primary },
  }[tone];
  return (
    <View style={{ backgroundColor: palette.bg, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
      <AppText variant="small" style={{ color: palette.fg }}>
        {label}
      </AppText>
    </View>
  );
}
