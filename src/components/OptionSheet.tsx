import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Sheet } from './Sheet';
import { TextField } from './TextField';

export interface SheetOption<K extends string> {
  key: K;
  label: string;
  sublabel?: string;
  left?: ReactNode;
  searchText?: string;
}

interface OptionSheetProps<K extends string> {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: readonly SheetOption<K>[];
  value: K | null;
  onSelect: (key: K) => void;
  searchable?: boolean;
  footer?: ReactNode;
  testID?: string;
}

export function OptionSheet<K extends string>({
  visible,
  onClose,
  title,
  options,
  value,
  onSelect,
  searchable = false,
  footer,
  testID,
}: OptionSheetProps<K>) {
  const { colors, spacing } = useTheme();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.sublabel ?? ''} ${o.searchText ?? ''}`.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <Sheet visible={visible} onClose={onClose} title={title} testID={testID}>
      {searchable ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <TextField
            placeholder="Search"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            left={<Ionicons name="search" size={18} color={colors.textFaint} />}
            testID={testID ? `${testID}-search` : undefined}
          />
        </View>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.key}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const selected = item.key === value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={testID ? `${testID}-option-${item.key}` : undefined}
              onPress={() => {
                onSelect(item.key);
                onClose();
              }}
              style={({ pressed }) => [
                styles.row,
                { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
              ]}
            >
              {item.left ? <View style={{ marginRight: spacing.md }}>{item.left}</View> : null}
              <View style={styles.flex}>
                <AppText variant="body">{item.label}</AppText>
                {item.sublabel ? (
                  <AppText variant="caption" tone="muted">
                    {item.sublabel}
                  </AppText>
                ) : null}
              </View>
              {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
            </Pressable>
          );
        }}
        ListFooterComponent={footer ? <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>{footer}</View> : undefined}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
