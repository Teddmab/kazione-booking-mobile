import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import type { DisplaySlot } from '@/lib/bookingSlots';

interface TimeSlotGridProps {
  slots: DisplaySlot[];
  selectedTime: string | null;
  onSelect: (time: string, isReservable: boolean) => void;
  isLoading: boolean;
  emptyMessage?: string;
}

export function TimeSlotGrid({
  slots,
  selectedTime,
  onSelect,
  isLoading,
  emptyMessage = 'No slots available',
}: TimeSlotGridProps) {
  if (isLoading) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} width={72} height={40} borderRadius={RADIUS.md} style={styles.chipMargin} />
        ))}
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const selected = selectedTime === slot.time;
        const tappable = slot.available || slot.reservable;
        const chipStyle = [
          styles.chip,
          !slot.available && !slot.reservable && styles.chipUnavailable,
          slot.reservable && (selected ? styles.chipReservableOn : styles.chipReservable),
          slot.available && selected && styles.chipSelected,
          slot.available && !selected && !slot.reservable && styles.chipAvailable,
        ];
        const textStyle = [
          styles.chipTime,
          !slot.available && !slot.reservable && styles.chipTextUnavailable,
          slot.reservable && (selected ? styles.chipTextReservableOn : styles.chipTextReservable),
          slot.available && selected && styles.chipTextSelected,
          slot.available && !selected && styles.chipTextAvailable,
        ];

        return (
          <Pressable
            key={slot.time}
            disabled={!tappable}
            style={chipStyle}
            onPress={() => onSelect(slot.time, slot.reservable)}>
            <Text style={textStyle}>{slot.time}</Text>
            {slot.reservable ? <Text style={styles.reservableHint}>⬡</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chipMargin: { margin: 4 },
  chip: {
    minWidth: 72,
    height: 40,
    margin: 4,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: SPACING.xs,
  },
  chipAvailable: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.orange,
  },
  chipSelected: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  chipReservable: {
    backgroundColor: '#3D2A10',
    borderColor: '#F0A830',
  },
  chipReservableOn: {
    backgroundColor: '#F0A830',
    borderColor: '#F0A830',
  },
  chipUnavailable: {
    backgroundColor: '#F5F5F5',
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  chipTime: { ...TYPOGRAPHY.label, fontWeight: '600' },
  chipTextAvailable: { color: COLORS.orange },
  chipTextSelected: { color: '#FFFFFF' },
  chipTextReservable: { color: '#F0A830' },
  chipTextReservableOn: { color: COLORS.background },
  chipTextUnavailable: { color: COLORS.textMuted },
  reservableHint: { fontSize: 8, color: '#F0A830', marginTop: -2 },
  empty: { paddingVertical: SPACING.lg, alignItems: 'center' },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textMuted, textAlign: 'center' },
});
