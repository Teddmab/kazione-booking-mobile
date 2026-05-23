import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { MARKETPLACE_CATEGORIES } from '@/constants/marketplace';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/tokens';

interface CategoryFilterProps {
  selected: string | undefined;
  onSelect: (category: string | undefined) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const pills: { label: string; value: string | undefined }[] = [
    { label: 'All', value: undefined },
    ...MARKETPLACE_CATEGORIES.map((c) => ({ label: c, value: c })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {pills.map((pill) => {
        const isActive = selected === pill.value;
        return (
          <Pressable
            key={pill.label}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelect(pill.value)}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{pill.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  pillText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
  },
  pillTextActive: {
    color: COLORS.background,
  },
});
