import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface NoticeProps {
  tone?: 'info' | 'warning' | 'success' | 'danger' | 'pro';
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export function Notice({ tone = 'info', title, message, actionLabel, onAction, testID }: NoticeProps) {
  const { colors, radius, spacing } = useTheme();
  const palette = {
    info: { bg: colors.primarySoft, fg: colors.primary, icon: 'information-circle' as const },
    warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'alert-circle' as const },
    success: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle' as const },
    danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'close-circle' as const },
    pro: { bg: colors.proSoft, fg: colors.pro, icon: 'sparkles' as const },
  }[tone];
  return (
    <View style={[styles.box, { backgroundColor: palette.bg, borderRadius: radius.md, padding: spacing.md }]} testID={testID}>
      <Ionicons name={palette.icon} size={20} color={palette.fg} style={{ marginRight: spacing.sm, marginTop: 1 }} />
      <View style={styles.flex}>
        {title ? (
          <AppText variant="bodyBold" style={{ color: palette.fg }}>
            {title}
          </AppText>
        ) : null}
        <AppText variant="caption" style={{ color: colors.text }}>
          {message}
        </AppText>
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction} style={{ marginTop: spacing.xs }} testID={testID ? `${testID}-action` : undefined}>
            <AppText variant="small" style={{ color: palette.fg }}>
              {actionLabel} →
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'flex-start' },
  flex: { flex: 1 },
});
