import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ProgressBar } from '@/components/booking/ProgressBar';
import { COLORS, SPACING } from '@/constants/tokens';

type StepNum = 1 | 2 | 3 | 4;

interface BookingStepShellProps {
  title: string;
  step: StepNum;
  onBack: () => void;
  rightAction?: React.ReactNode;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  onContinue?: () => void;
  children: React.ReactNode;
}

export function BookingStepShell({
  title,
  step,
  onBack,
  rightAction,
  continueLabel = 'Continue →',
  continueDisabled,
  continueLoading,
  onContinue,
  children,
}: BookingStepShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title={title} showBack onBack={onBack} rightAction={rightAction} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ProgressBar currentStep={step} />
        {children}
      </ScrollView>
      {onContinue ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
          <Button
            label={continueLabel}
            onPress={onContinue}
            disabled={continueDisabled}
            loading={continueLoading}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});
