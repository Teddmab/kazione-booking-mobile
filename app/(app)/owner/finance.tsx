import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { DashboardStatCard } from "@/components/owner/DashboardStatCard";
import { FinanceInsightCard } from "@/components/owner/FinanceInsightCard";
import { PeriodChipSelector } from "@/components/owner/PeriodChipSelector";
import { QueryState } from "@/components/owner/QueryState";
import { RevenueBarChart } from "@/components/owner/RevenueBarChart";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useAIInsights } from "@/hooks/useOwnerAI";
import {
  useRevenueBreakdown,
  useRevenueSummary,
  useStaffPerformanceFinance,
} from "@/hooks/useOwnerFinance";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/lib/format";
import type { FinancePeriodKey } from "@/types/finance";

function topServiceName(
  services: { service_name: string; total: number; count: number }[] | undefined,
) {
  if (!services?.length) return "—";
  const top = [...services].sort((a, b) => b.total - a.total)[0];
  return top?.service_name ?? "—";
}

export default function OwnerFinanceScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [period, setPeriod] = useState<FinancePeriodKey>("month");

  const revenue = useRevenueSummary(businessId, period);
  const breakdown = useRevenueBreakdown(businessId, period);
  const staffPerf = useStaffPerformanceFinance(businessId, period);
  const insights = useAIInsights(businessId, 30);

  const completedCount = useMemo(() => {
    const services = revenue.data?.income_by_service ?? [];
    return services.reduce((sum, s) => sum + (s.count ?? 0), 0);
  }, [revenue.data]);

  const avgTicket =
    completedCount > 0 ? (revenue.data?.total_income ?? 0) / completedCount : 0;

  const periodChips = useMemo(
    () => [
      { key: "today" as const, label: t("owner.financePeriodToday") },
      { key: "week" as const, label: t("owner.financePeriodWeek") },
      { key: "month" as const, label: t("owner.financePeriodMonth") },
      { key: "custom" as const, label: t("owner.financePeriodCustom") },
    ],
    [t],
  );

  const topStaff = (staffPerf.data ?? [])
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);
  const topServices = (revenue.data?.income_by_service ?? [])
    .slice()
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const refreshing =
    revenue.isRefetching || breakdown.isRefetching || staffPerf.isRefetching;

  const refetchAll = () => {
    void revenue.refetch();
    void breakdown.refetch();
    void staffPerf.refetch();
    void insights.refetch();
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} />}>
      <PeriodChipSelector value={period} chips={periodChips} onChange={setPeriod} />

      <QueryState
        loading={revenue.isLoading}
        error={revenue.isError ? (revenue.error as Error) : null}
        onRetry={refetchAll}>
        <View style={styles.grid}>
          <DashboardStatCard
            label={t("owner.financeTotalRevenue")}
            value={formatCurrency(revenue.data?.total_income ?? 0)}
            icon="cash-outline"
          />
          <DashboardStatCard
            label={t("owner.financeCompletedAppts")}
            value={String(completedCount)}
            icon="checkmark-circle-outline"
          />
          <DashboardStatCard
            label={t("owner.financeAvgTicket")}
            value={formatCurrency(avgTicket)}
            icon="receipt-outline"
          />
          <DashboardStatCard
            label={t("owner.financeTopService")}
            value={topServiceName(revenue.data?.income_by_service)}
            icon="cut-outline"
          />
        </View>

        <Text style={styles.section}>{t("owner.financeChartTitle")}</Text>
        <RevenueBarChart data={breakdown.data ?? []} language={language} />

        <Text style={styles.section}>{t("owner.financeTopStaff")}</Text>
        {topStaff.length === 0 ? (
          <Text style={styles.empty}>{t("owner.financeNoData")}</Text>
        ) : (
          topStaff.map((row) => (
            <View key={row.staff_profile_id} style={styles.performerRow}>
              <Text style={styles.performerName}>{row.display_name}</Text>
              <Text style={styles.performerMeta}>
                {formatCurrency(row.revenue)} · {row.bookings} {t("owner.financeBookings")}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.section}>{t("owner.financeTopServices")}</Text>
        {topServices.length === 0 ? (
          <Text style={styles.empty}>{t("owner.financeNoData")}</Text>
        ) : (
          topServices.map((row) => (
            <View key={row.service_id} style={styles.performerRow}>
              <Text style={styles.performerName}>{row.service_name}</Text>
              <Text style={styles.performerMeta}>
                {formatCurrency(row.total)} · {row.count} {t("owner.financeBookings")}
              </Text>
            </View>
          ))
        )}

        <FinanceInsightCard
          insights={insights.data?.insights ?? []}
          loading={insights.isLoading || insights.isFetching}
          onRefresh={() => void insights.refetch()}
        />
      </QueryState>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 12 },
  section: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  performerRow: {
    backgroundColor: ownerColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 12,
    marginBottom: 8,
  },
  performerName: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  performerMeta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
  empty: { fontSize: 14, color: ownerColors.textMuted, marginBottom: 8 },
});
