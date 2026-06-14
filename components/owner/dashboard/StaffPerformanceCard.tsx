import { StyleSheet, Text, View } from "react-native";

import { DashboardPanel } from "@/components/owner/dashboard/DashboardPanel";
import { ownerColors } from "@/constants/ownerTheme";
import { formatCurrency } from "@/lib/format";
import type { StaffPerformanceRow } from "@/types/finance";

interface Props {
  rows: StaffPerformanceRow[];
  loading?: boolean;
}

export function StaffPerformanceCard({ rows, loading }: Props) {
  const list = rows.slice(0, 4);

  return (
    <DashboardPanel
      title="Staff Performance"
      subtitle="Today's snapshot"
      icon="cut-outline">
      {loading ? (
        <Text style={styles.empty}>Chargement…</Text>
      ) : list.length === 0 ? (
        <Text style={styles.empty}>Aucune donnée staff aujourd'hui</Text>
      ) : (
        list.map((s) => {
          const utilization = Math.min(100, Math.round(s.completion_rate * 100) || s.bookings * 10);
          const initials = s.display_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return (
            <View key={s.staff_profile_id} style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.meta}>
                <Text style={styles.name} numberOfLines={1}>{s.display_name}</Text>
                <Text style={styles.sub}>
                  {s.bookings} RDV · {formatCurrency(s.revenue)}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${utilization}%` }]} />
                </View>
              </View>
              <View style={styles.rating}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.ratingVal}>
                  {s.avg_rating > 0 ? s.avg_rating.toFixed(1) : "—"}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </DashboardPanel>
  );
}

const styles = StyleSheet.create({
  empty: { padding: 16, fontSize: 14, color: ownerColors.textMuted },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ownerColors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ownerColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  meta: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  sub: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: ownerColors.border,
    marginTop: 6,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: ownerColors.primary, borderRadius: 2 },
  rating: { flexDirection: "row", alignItems: "center", gap: 2 },
  star: { color: ownerColors.primary, fontSize: 12 },
  ratingVal: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
});
