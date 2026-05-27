import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import type { StorefrontService } from '@/types/marketplace';

interface ServiceCardProps {
  service: StorefrontService;
  currencySymbol?: string;
  onPress: () => void;
}

export function ServiceCard({ service, currencySymbol = '€', onPress }: ServiceCardProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Image
          source={service.imageUrl ? { uri: service.imageUrl } : undefined}
          style={styles.thumb}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={2}>
            {service.name}
          </Text>
          <Text style={styles.duration}>{service.durationMin} min</Text>
          <Text style={styles.price}>
            {currencySymbol}
            {service.price.toFixed(0)}
          </Text>
        </View>
        <Button label="Book" size="sm" onPress={onPress} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.elevated,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
  },
  duration: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  price: {
    ...TYPOGRAPHY.label,
    color: COLORS.orange,
    fontWeight: '700',
  },
});
