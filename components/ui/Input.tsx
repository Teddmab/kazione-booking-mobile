import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/tokens';

interface InputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  error,
  maxLength,
  keyboardType,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize={secureTextEntry ? 'none' : undefined}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    color: COLORS.text,
    ...TYPOGRAPHY.body,
  },
  inputFocused: {
    borderColor: COLORS.gold,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
});
