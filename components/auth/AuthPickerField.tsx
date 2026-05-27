import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AUTH_THEME } from '@/constants/authTheme';
import { TYPOGRAPHY } from '@/constants/tokens';

export interface PickerOption {
  value: string;
  label: string;
}

interface AuthPickerFieldProps {
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
}

export function AuthPickerField({ label, value, options, onChange }: AuthPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          style={styles.field}
          onPress={() => setOpen(true)}
          accessibilityRole="button">
          <Text style={styles.value}>{selected?.label ?? value}</Text>
          <Text style={styles.chevron}>▾</Text>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <ScrollView style={styles.list}>
            {options.map((option) => {
              const active = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}>
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', gap: 6 },
  label: {
    ...TYPOGRAPHY.label,
    color: AUTH_THEME.text,
    fontSize: 14,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: AUTH_THEME.border,
    borderRadius: 12,
    backgroundColor: AUTH_THEME.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
  value: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: AUTH_THEME.text,
    flex: 1,
  },
  chevron: {
    fontSize: 14,
    color: AUTH_THEME.textMuted,
    marginLeft: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 15, 10, 0.45)',
  },
  sheet: {
    backgroundColor: AUTH_THEME.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '55%',
  },
  sheetTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    color: AUTH_THEME.text,
    marginBottom: 12,
  },
  list: { flexGrow: 0 },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: '#FFF8F6',
  },
  optionText: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: AUTH_THEME.text,
  },
  optionTextActive: {
    color: AUTH_THEME.primary,
    fontWeight: '600',
  },
});
