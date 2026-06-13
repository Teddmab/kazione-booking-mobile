import { StyleSheet, Text, View } from "react-native";

import { DashboardPanel } from "@/components/owner/dashboard/DashboardPanel";
import { ownerColors } from "@/constants/ownerTheme";
import { formatCurrency } from "@/lib/format";
import type { RevenueSummary } from "@/types/finance";

interface Props {
  summary: RevenueSummary | undefined;
  commissionsDue?: number;
  onExport?: () => void;
}

const REVENUE_TARGET = 5000;

export function FinanceOverviewCard({ summary, commissionsDue = 0, onExport }: Props) {
  const revenue = summary?.total_income ?? 0;
  const expenses = summary?.total_expenses ?? 0;
  const net = summary?.net_profit ?? 0;
  const marginPct = revenue > 0 ? ((net / revenue) * 100).toFixed(1) : "0";
  const targetPct = Math.min(100, Math.round((revenue / REVENUE_TARGET) * 100));

  return (
    <DashboardPanel
      title="Financial Overview"
      subtitle="Month to date"
      icon="wallet-outline"
      actionLabel={onExport ? "Export" : undefined}
      onAction={onExport}>
      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.label}>Revenue (MTD)</Text>
          <Text style={styles.value}>{formatCurrency(revenue)}</Text>
          <Text style={styles.detail}>Target: {formatCurrency(REVENUE_TARGET)}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${targetPct}%` }]} />
          </View>
          <Text style={styles.pct}>{targetPct}%</Text>
        </View>
        <View style={[styles.cell, styles.cellBorder]}>
          <Text style={styles.label}>Commissions Due</Text>
          <Text style={styles.value}>{formatCurrency(commissionsDue)}</Text>
          <Text style={styles.detail}>Pending payout</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Operating Expenses</Text>
          <Text style={styles.value}>{formatCurrency(expenses)}</Text>
          <Text style={styles.detail}>This month</Text>
        </View>
        <View style={[styles.cell, styles.cellBorder]}>
          <Text style={styles.label}>Net Margin</Text>
          <Text style={styles.value}>{formatCurrency(net)}</Text>
          <Text style={styles.detail}>{marginPct}% margin</Text>
        </View>
      </View>
    </DashboardPanel>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "50%", padding: 14 },
  cellBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: ownerColors.border },
  label: { fontSize: 12, color: ownerColors.textMuted, marginBottom: 4 },
  value: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  detail: { fontSize: 12, color: ownerColors.textMuted, marginTop: 4 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ownerColors.border,
    marginTop: 8,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: ownerColors.primary, borderRadius: 3 },
  pct: { fontSize: 11, color: ownerColors.textMuted, marginTop: 4, textAlign: "right" },
});
