import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { AUTH_THEME } from '@/constants/authTheme';
import { TYPOGRAPHY } from '@/constants/tokens';

interface AuthTextFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: 'email' | 'password' | 'name' | 'off';
  labelRight?: React.ReactNode;
  rightAccessory?: React.ReactNode;
}

export function AuthTextField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoComplete,
  labelRight,
  rightAccessory,
}: AuthTextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelRight}
      </View>
      <View style={styles.inputWrap}>
        <TextInput
          style={[
            styles.input,
            rightAccessory ? styles.inputWithAccessory : null,
            focused && styles.inputFocused,
          ]}
          placeholder={placeholder}
          placeholderTextColor={AUTH_THEME.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...TYPOGRAPHY.label,
    color: AUTH_THEME.text,
    fontWeight: '500',
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    backgroundColor: AUTH_THEME.surface,
    borderWidth: 1,
    borderColor: AUTH_THEME.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: AUTH_THEME.text,
  },
  inputWithAccessory: {
    paddingRight: 48,
  },
  inputFocused: {
    borderColor: AUTH_THEME.primary,
  },
  accessory: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
