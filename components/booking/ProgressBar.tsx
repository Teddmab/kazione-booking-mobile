import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';

type StepNum = 1 | 2 | 3 | 4;

interface ProgressBarProps {
  currentStep: StepNum;
  totalSteps?: number;
}

export function ProgressBar({ currentStep, totalSteps = 4 }: ProgressBarProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1) as StepNum[];

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {steps.map((step, index) => {
          const completed = step < currentStep;
          const active = step === currentStep;
          return (
            <View key={step} style={styles.stepWrap}>
              <View
                style={[
                  styles.circle,
                  completed && styles.circleCompleted,
                  active && styles.circleActive,
                ]}>
                {completed ? (
                  <Ionicons name="checkmark" size={14} color={COLORS.orange} />
                ) : (
                  <Text style={[styles.num, active && styles.numActive]}>{step}</Text>
                )}
              </View>
              {index < steps.length - 1 ? (
                <View style={[styles.line, completed && styles.lineCompleted]} />
              ) : null}
            </View>
          );
        })}
      </View>
      <Text style={styles.label}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  stepWrap: { flexDirection: 'row', alignItems: 'center' },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  circleActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  circleCompleted: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.background,
  },
  num: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  numActive: { color: COLORS.background },
  line: {
    width: 28,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  lineCompleted: { backgroundColor: COLORS.orange },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
