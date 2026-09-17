import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { formatCurrency } from "@/lib/format";
import type { DashboardPeriodMetrics } from "@/lib/ownerDashboardLayout";

export function OwnerPeriodPerformanceCard({
  metrics,
  rangeLabel,
}: {
  metrics: DashboardPeriodMetrics;
  rangeLabel: string;
}) {
  const { t } = useTranslation();

  const cells = [
    { key: "earned", label: t("owner.dashEarned"), value: formatCurrency(metrics.earned) },
    { key: "expected", label: t("owner.dashExpected"), value: formatCurrency(metrics.expected) },
    {
      key: "done",
      label: t("owner.txStatus_completed"),
      value: `${metrics.completedCount}`,
      hint: `${t("owner.dashOf")} ${metrics.totalAppointments}`,
    },
    {
      key: "cancel",
      label: t("owner.dashCancelled"),
      value: String(metrics.cancelledCount),
      hint: `${metrics.cancelledRatePct}%`,
      danger: metrics.cancelledCount > 0,
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <View style={styles.icon}>
            <Ionicons name="trending-up-outline" size={16} color={ownerColors.primary} />
          </View>
          <Text style={styles.title}>{t("owner.dashPeriodPerf")}</Text>
        </View>
        <Text style={styles.range}>{rangeLabel}</Text>
      </View>
      <View style={styles.grid}>
        {cells.map((c) => (
          <View key={c.key} style={styles.cell}>
            <Text style={styles.cellLabel}>{c.label}</Text>
            <Text style={[styles.cellValue, c.danger && styles.danger]}>
              {c.value}
              {c.hint ? <Text style={styles.hint}> {c.hint}</Text> : null}
            </Text>
          </View>
        ))}
      </View>
      {metrics.topServices.length > 0 ? (
        <View style={styles.top}>
          <Text style={styles.topTitle}>{t("owner.dashMostBooked")}</Text>
          {metrics.topServices.map((s, i) => (
            <View key={s.name} style={styles.topRow}>
              <View style={styles.rank}>
                <Text style={styles.rankText}>{i + 1}</Text>
              </View>
              <Text style={styles.svc} numberOfLines={1}>
                {s.name}
              </Text>
              <Text style={styles.svcCount}>{s.count}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  headLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ownerColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: ownerFonts.semiBold, fontSize: 14, color: ownerColors.text, flex: 1 },
  range: { fontSize: 11, color: ownerColors.textMuted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  cell: {
    width: "48%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.primarySurface,
    borderRadius: 12,
    padding: 12,
  },
  cellLabel: { fontSize: 11, color: ownerColors.textMuted, marginBottom: 4 },
  cellValue: { fontFamily: ownerFonts.bold, fontSize: 18, color: ownerColors.text },
  hint: { fontSize: 12, fontFamily: ownerFonts.medium, color: ownerColors.textMuted },
  danger: { color: ownerColors.danger },
  top: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  topTitle: { fontFamily: ownerFonts.semiBold, fontSize: 13, color: ownerColors.text, marginBottom: 8 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  rank: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ownerColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 11, fontFamily: ownerFonts.semiBold, color: ownerColors.primary },
  svc: { flex: 1, fontSize: 13, color: ownerColors.text },
  svcCount: { fontSize: 12, color: ownerColors.textMuted },
});
