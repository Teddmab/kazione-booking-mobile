import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { SALON_CARD_HEIGHT } from '@/constants/marketplace';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';

export function SalonCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={120} borderRadius={RADIUS.md} />
      <Skeleton width="70%" height={16} style={styles.gap} />
      <Skeleton width="50%" height={12} />
      <Skeleton width="80%" height={24} style={styles.gap} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: SALON_CARD_HEIGHT,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    overflow: 'hidden',
  },
  gap: {
    marginTop: SPACING.sm,
  },
});
