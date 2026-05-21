import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Ionicons name="alert-circle" size={32} color={COLORS.error} />
        <Text style={styles.message}>{message}</Text>
        {onRetry ? (
          <Button variant="secondary" label="Retry" onPress={onRetry} />
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  card: {
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(224, 72, 72, 0.35)',
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    textAlign: 'center',
  },
});
