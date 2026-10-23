import { Pressable, StyleSheet, Text, View } from 'react-native';

import { selectionHaptic } from '@/services/haptics';
import { useTheme } from '@/theme/useTheme';

interface EmojiGridProps {
  emojis: readonly string[];
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiGrid({ emojis, value, onChange }: EmojiGridProps) {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.grid}>
      {emojis.map((e) => {
        const selected = e === value;
        return (
          <Pressable
            key={e}
            accessibilityRole="button"
            accessibilityLabel={`Emoji ${e}`}
            accessibilityState={{ selected }}
            onPress={() => {
              selectionHaptic();
              onChange(e);
            }}
            style={[
              styles.emojiCell,
              { borderRadius: radius.md, backgroundColor: selected ? colors.primarySoft : 'transparent', borderColor: selected ? colors.primary : 'transparent' },
            ]}
          >
            <Text style={styles.emoji}>{e}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ColorGridProps {
  colors: readonly string[];
  value: string;
  onChange: (color: string) => void;
}

export function ColorGrid({ colors: palette, value, onChange }: ColorGridProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.grid}>
      {palette.map((c) => {
        const selected = c.toLowerCase() === value.toLowerCase();
        return (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Colour ${c}`}
            accessibilityState={{ selected }}
            onPress={() => {
              selectionHaptic();
              onChange(c);
            }}
            style={styles.colorCell}
          >
            <View style={[styles.swatch, { backgroundColor: c, borderColor: selected ? colors.text : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  emojiCell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', margin: 2, borderWidth: 1 },
  emoji: { fontSize: 24, lineHeight: 30 },
  colorCell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', margin: 2 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 3 },
});
