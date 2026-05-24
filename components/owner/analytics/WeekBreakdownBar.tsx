import { StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

type Props = {
  pending: number;
  completed: number;
  cancelled: number;
  labels: { pending: string; completed: string; cancelled: string };
};

export function WeekBreakdownBar({ pending, completed, cancelled, labels }: Props) {
  const total = Math.max(pending + completed + cancelled, 1);

  const rows = [
    { key: "completed", value: completed, color: ownerColors.success, label: labels.completed },
    { key: "pending", value: pending, color: ownerColors.warning, label: labels.pending },
    { key: "cancelled", value: cancelled, color: ownerColors.danger, label: labels.cancelled },
  ];

  return (
    <View style={styles.wrap}>
      {rows.map((row) => {
        const pct = Math.round((row.value / total) * 100);
        return (
          <View key={row.key} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: row.color }]} />
            </View>
            <Text style={styles.pct}>{pct}%</Text>
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
  label: { width: 88, fontSize: 12, color: ownerColors.textMuted },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: ownerColors.border,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
  pct: { width: 36, fontSize: 12, fontWeight: "600", color: ownerColors.text, textAlign: "right" },
});
