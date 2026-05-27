import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/tokens';

export interface StaffPick {
  id: string | null;
  name: string;
  role?: string;
  avatarUrl?: string | null;
  rating?: number;
}

interface StaffCardProps {
  staff: StaffPick;
  selected: boolean;
  onSelect: () => void;
  noPreference?: boolean;
}

export function StaffCard({ staff, selected, onSelect, noPreference }: StaffCardProps) {
  const initials = noPreference
    ? '??'
    : staff.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

  return (
    <Card onPress={onSelect} style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.row}>
        {noPreference ? (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        ) : staff.avatarUrl ? (
          <Image source={{ uri: staff.avatarUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {staff.name}
          </Text>
          {staff.role || noPreference ? (
            <Text style={styles.meta} numberOfLines={2}>
              {noPreference
                ? "We'll assign the best available stylist"
                : staff.role}
            </Text>
          ) : null}
          {!noPreference && staff.rating != null && staff.rating > 0 ? (
            <Text style={styles.rating}>★ {staff.rating.toFixed(1)}</Text>
          ) : null}
        </View>
        <View style={[styles.check, selected && styles.checkOn]}>
          {selected ? <Ionicons name="checkmark" size={16} color={COLORS.background} /> : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.sm },
  cardSelected: { borderColor: COLORS.orange, borderWidth: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.elevated,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...TYPOGRAPHY.label, color: COLORS.textMuted, fontWeight: '700' },
  body: { flex: 1, minWidth: 0 },
  name: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '600' },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: 2 },
  rating: { ...TYPOGRAPHY.caption, color: COLORS.orange, marginTop: 4 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
});
