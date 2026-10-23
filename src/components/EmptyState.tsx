import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Button } from './Button';

interface EmptyStateProps {
  emoji: string;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export function EmptyState({ emoji, title, body, actionLabel, onAction, testID }: EmptyStateProps) {
  const { spacing, colors, radius } = useTheme();
  return (
    <View style={[styles.wrap, { padding: spacing.xl }]} testID={testID}>
      <View style={[styles.badge, { backgroundColor: colors.primarySoft, borderRadius: radius.xl }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <AppText variant="h2" align="center" style={{ marginTop: spacing.lg }}>
        {title}
      </AppText>
      <AppText variant="body" tone="muted" align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
        {body}
      </AppText>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={{ marginTop: spacing.xl }} testID={testID ? `${testID}-action` : undefined} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  badge: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 44, lineHeight: 54 },
});
