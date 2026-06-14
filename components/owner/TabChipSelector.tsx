import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

type Chip<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  value: T;
  chips: Chip<T>[];
  onChange: (key: T) => void;
  dense?: boolean;
};

export function TabChipSelector<T extends string>({ value, chips, onChange, dense }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, dense && styles.rowDense]}>
      {chips.map((chip) => {
        const active = chip.key === value;
        return (
          <Pressable
            key={chip.key}
            style={[styles.chip, dense && styles.chipDense, active && styles.chipActive]}
            onPress={() => onChange(chip.key)}>
            <Text style={[styles.chipText, dense && styles.chipTextDense, active && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  rowDense: { paddingVertical: 0, gap: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
  },
  chipDense: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  chipActive: { backgroundColor: ownerColors.primary, borderColor: ownerColors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: ownerColors.textMuted },
  chipTextDense: { fontSize: 12 },
  chipTextActive: { color: "#fff" },
});
