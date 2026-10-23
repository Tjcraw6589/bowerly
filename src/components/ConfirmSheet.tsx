import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Sheet } from './Sheet';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
}

/** Replaces Alert.alert so confirmations look the same everywhere, including the web preview. */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  testID,
}: ConfirmSheetProps) {
  const { spacing } = useTheme();
  return (
    <Sheet visible={visible} onClose={onCancel} testID={testID}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <AppText variant="h2">{title}</AppText>
        <AppText variant="body" tone="muted" style={{ marginTop: spacing.sm }}>
          {message}
        </AppText>
        <Button
          label={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          onPress={onConfirm}
          fullWidth
          style={{ marginTop: spacing.xl }}
          testID={testID ? `${testID}-confirm` : undefined}
        />
        <Button label={cancelLabel} variant="ghost" onPress={onCancel} fullWidth style={{ marginTop: spacing.sm }} />
      </View>
    </Sheet>
  );
}
