import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import type { FinancePeriodKey } from "@/types/finance";

type Chip = { key: FinancePeriodKey; label: string };

type Props = {
  value: FinancePeriodKey;
  chips: Chip[];
  onChange: (key: FinancePeriodKey) => void;
};

export function PeriodChipSelector({ value, chips, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {chips.map((chip) => {
        const active = chip.key === value;
        return (
          <Pressable
            key={chip.key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(chip.key)}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
  },
  chipActive: {
    backgroundColor: ownerColors.primary,
    borderColor: ownerColors.primary,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: ownerColors.textMuted },
  chipTextActive: { color: "#fff" },
});
