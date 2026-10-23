import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import type { TypographyVariant } from '@/theme/tokens';

export type TextTone = 'text' | 'muted' | 'faint' | 'primary' | 'danger' | 'success' | 'warning' | 'onPrimary' | 'pro';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
}

export function AppText({ variant = 'body', tone = 'text', align, style, ...rest }: AppTextProps) {
  const { colors, typography } = useTheme();
  const color = {
    text: colors.text,
    muted: colors.textMuted,
    faint: colors.textFaint,
    primary: colors.primary,
    danger: colors.danger,
    success: colors.success,
    warning: colors.warning,
    onPrimary: colors.onPrimary,
    pro: colors.pro,
  }[tone];
  return <Text {...rest} style={[typography[variant], { color, textAlign: align }, style]} />;
}
