import { Pressable, StyleSheet } from 'react-native';

import { selectionHaptic } from '@/services/haptics';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  testID?: string;
}

export function Chip({ label, selected = false, onPress, color, testID }: ChipProps) {
  const { colors, radius, spacing } = useTheme();
  const accent = color ?? colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={testID}
      onPress={() => {
        selectionHaptic();
        onPress?.();
      }}
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: selected ? accent : colors.surface,
          borderColor: selected ? accent : colors.border,
        },
      ]}
    >
      <AppText variant="small" style={{ color: selected ? '#FFFFFF' : colors.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, marginRight: 8, marginBottom: 8 },
});
