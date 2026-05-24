import { StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

type Item = { label: string; value: number; formatted?: string };

type Props = {
  items: Item[];
  emptyLabel?: string;
};

export function HorizontalBarChart({ items, emptyLabel = "—" }: Props) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const sorted = [...items].sort((a, b) => b.value - a.value).slice(0, 8);

  if (sorted.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {sorted.map((item) => {
        const pct = Math.max(4, (item.value / max) * 100);
        return (
          <View key={item.label} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.value}>{item.formatted ?? String(item.value)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    gap: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { width: 72, fontSize: 12, color: ownerColors.textMuted },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: ownerColors.border,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: ownerColors.primary, borderRadius: 4 },
  value: { width: 56, fontSize: 11, fontWeight: "600", color: ownerColors.text, textAlign: "right" },
  empty: {
    padding: 20,
    alignItems: "center",
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  emptyText: { color: ownerColors.textMuted, fontSize: 14 },
});
