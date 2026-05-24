import { StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

type Segment = { label: string; value: number; color: string };

type Props = {
  segments: Segment[];
  emptyLabel?: string;
};

export function SegmentBarChart({ segments, emptyLabel = "—" }: Props) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.barRow}>
        {segments.map((seg) =>
          seg.value > 0 ? (
            <View
              key={seg.label}
              style={[styles.segment, { flex: seg.value, backgroundColor: seg.color }]}
            />
          ) : null,
        )}
      </View>
      <View style={styles.legend}>
        {segments.map((seg) => (
          <View key={seg.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: seg.color }]} />
            <Text style={styles.legendText}>
              {seg.label} ({seg.value})
            </Text>
          </View>
        ))}
      </View>
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
  },
  barRow: { flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden" },
  segment: { minWidth: 4 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: ownerColors.textMuted },
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
