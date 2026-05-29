import { StyleSheet, Text, View } from 'react-native';

import { AUTH_THEME } from '@/constants/authTheme';
import { TYPOGRAPHY } from '@/constants/tokens';

interface Props {
  step: 1 | 2;
  label: string;
}

export function SignupStepIndicator({ step, label }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        <View style={[styles.dot, step >= 1 && styles.dotActive]} />
        <View style={[styles.dot, step >= 2 && styles.dotActive]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 4 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: {
    height: 4,
    width: 40,
    borderRadius: 2,
    backgroundColor: AUTH_THEME.mutedTrack,
  },
  dotActive: {
    backgroundColor: AUTH_THEME.primary,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: AUTH_THEME.textMuted,
  },
});
