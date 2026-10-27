import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { tapHaptic } from '@/services/haptics';
import { useTheme } from '@/theme/useTheme';

interface FABProps {
  onPress: () => void;
  bottomOffset?: number;
  accessibilityLabel?: string;
  testID?: string;
}

export function FAB({ onPress, bottomOffset = 0, accessibilityLabel = 'Add bill or subscription', testID }: FABProps) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: colors.primary,
          right: spacing.lg,
          bottom: spacing.lg + bottomOffset,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <Ionicons name="add" size={30} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
