import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ownerColors, ownerFonts } from '@/constants/ownerTheme';

interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
}

export function AuthPrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: AuthPrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const isOutline = variant === 'outline';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.hitArea,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.surface,
          isOutline ? styles.outline : styles.primary,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isOutline ? ownerColors.primary : '#FFFFFF'} />
        ) : (
          <Text style={[styles.label, isOutline ? styles.labelOutline : styles.labelPrimary]}>
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    width: '100%',
    alignSelf: 'center',
  },
  surface: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: ownerColors.primary,
  },
  outline: {
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: ownerFonts.semiBold,
    textAlign: 'center',
  },
  labelPrimary: {
    color: '#FFFFFF',
  },
  labelOutline: {
    color: ownerColors.primary,
  },
});
