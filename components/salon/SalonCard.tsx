import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SALON_CARD_HEIGHT } from '@/constants/marketplace';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import type { SalonListItem } from '@/types/marketplace';

export { SALON_CARD_HEIGHT };

interface SalonCardProps {
  salon: SalonListItem;
  onPress: () => void;
  onBook?: () => void;
}

export function SalonCard({ salon, onPress, onBook }: SalonCardProps) {
  const imageUri = salon.cover_image_url ?? salon.logo_url;

  return (
    <Card style={styles.card} onPress={onPress}>
      <Image
        source={imageUri ? { uri: imageUri } : undefined}
        style={styles.image}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {salon.name}
          </Text>
          {salon.is_featured ? <Badge label="Featured" variant="brand" /> : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          ★ {salon.rating.toFixed(1)} · {salon.city ?? '—'}
        </Text>
        <View style={styles.tags}>
          {salon.top_services.slice(0, 2).map((s) => (
            <Badge key={s} label={s} variant="muted" />
          ))}
        </View>
        <View style={styles.bookRow}>
          <Button
            label="Book"
            size="sm"
            onPress={() => (onBook ? onBook() : onPress())}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    height: SALON_CARD_HEIGHT,
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.elevated,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  body: {
    flex: 1,
    padding: SPACING.sm,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  name: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
    flex: 1,
  },
  meta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  bookRow: {
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
});
