import { StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, TYPOGRAPHY } from '@/constants/tokens';

type BadgeVariant = 'success' | 'warning' | 'error' | 'gold' | 'muted';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: 'rgba(76, 175, 130, 0.2)', text: COLORS.success },
  warning: { bg: 'rgba(240, 168, 48, 0.2)', text: COLORS.warning },
  error: { bg: 'rgba(224, 72, 72, 0.2)', text: COLORS.error },
  gold: { bg: 'rgba(200, 169, 81, 0.2)', text: COLORS.gold },
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
