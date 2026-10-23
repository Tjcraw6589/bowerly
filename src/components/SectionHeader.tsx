import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface SectionHeaderProps {
  title: string;
  right?: ReactNode;
  first?: boolean;
}

export function SectionHeader({ title, right, first = false }: SectionHeaderProps) {
  const { spacing } = useTheme();
  return (
    <View style={[styles.row, { marginTop: first ? spacing.sm : spacing.xl, marginBottom: spacing.sm }]}>
      <AppText variant="h3">{title}</AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
