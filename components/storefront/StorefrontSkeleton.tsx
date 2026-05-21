import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { COLORS, SPACING } from '@/constants/tokens';

export function StorefrontSkeleton() {
  return (
    <View style={styles.wrap}>
      <Skeleton width="100%" height={220} borderRadius={0} />
      <View style={styles.pad}>
        <Skeleton width="40%" height={24} />
        <Skeleton width="60%" height={14} style={styles.gap} />
        <Skeleton width="100%" height={80} style={styles.gap} />
        <Skeleton width="100%" height={80} style={styles.gap} />
        <Skeleton width="100%" height={80} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pad: {
    padding: SPACING.md,
  },
  gap: {
    marginTop: SPACING.md,
  },
});
