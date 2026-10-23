import type { ReactNode } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  left?: ReactNode;
  right?: ReactNode;
}

/** Labelled input with error and helper text. `ref` passes straight through to the TextInput (React 19). */
export function TextField({ label, error, helper, left, right, style, multiline, ...rest }: TextFieldProps) {
  const { colors, radius, spacing, typography } = useTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label ? (
        <AppText variant="small" tone="muted" style={{ marginBottom: spacing.xs }}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            minHeight: multiline ? 96 : 48,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        {left ? <View style={{ marginRight: spacing.sm }}>{left}</View> : null}
        <TextInput
          {...rest}
          multiline={multiline}
          placeholderTextColor={colors.textFaint}
          style={[
            styles.input,
            typography.body,
            { color: colors.text, paddingVertical: multiline ? spacing.md : 0, textAlignVertical: multiline ? 'top' : 'center' },
            style,
          ]}
        />
        {right ? <View style={{ marginLeft: spacing.sm }}>{right}</View> : null}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" style={{ marginTop: spacing.xs }}>
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', borderWidth: 1 },
  input: { flex: 1 },
});
