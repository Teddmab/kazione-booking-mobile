import { StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, TYPOGRAPHY } from '@/constants/tokens';

type BadgeVariant = 'success' | 'warning' | 'error' | 'brand' | 'muted';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: COLORS.successMuted, text: '#166534' },
  warning: { bg: COLORS.warningMuted, text: '#854D0E' },
  error: { bg: COLORS.errorMuted, text: '#991B1B' },
  brand: { bg: 'rgba(232, 78, 38, 0.12)', text: COLORS.orange },
  muted: { bg: COLORS.elevated, text: COLORS.textMuted },
};

export function Badge({ label, variant = 'muted' }: BadgeProps) {
  const colors = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
});
