import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface RowProps {
  title: string;
  subtitle?: string;
  value?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  toggle?: { value: boolean; onValueChange: (next: boolean) => void; disabled?: boolean };
  last?: boolean;
  testID?: string;
}

/** A settings-style list row. Combine several inside a Card with padded={false}. */
export function Row({ title, subtitle, value, left, right, onPress, chevron, destructive, toggle, last, testID }: RowProps) {
  const { colors, spacing } = useTheme();
  const interactive = Boolean(onPress) && !toggle;
  const content = (
    <View
      style={[
        styles.row,
        { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      {left ? <View style={{ marginRight: spacing.md }}>{left}</View> : null}
      <View style={styles.flex}>
        <AppText variant="body" tone={destructive ? 'danger' : 'text'} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="body" tone="muted" numberOfLines={1} style={{ marginLeft: spacing.sm, maxWidth: '45%' }}>
          {value}
        </AppText>
      ) : null}
      {right}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onValueChange}
          disabled={toggle.disabled}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#FFFFFF"
          accessibilityLabel={title}
          testID={testID ? `${testID}-switch` : undefined}
        />
      ) : null}
      {chevron || (interactive && chevron !== false) ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} style={{ marginLeft: spacing.xs }} />
      ) : null}
    </View>
  );
  if (interactive) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceAlt : 'transparent' })}
      >
        {content}
      </Pressable>
    );
  }
  return <View testID={testID}>{content}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
