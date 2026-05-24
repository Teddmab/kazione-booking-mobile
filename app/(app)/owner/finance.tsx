import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, Text, View, TextInput, Pressable } from "react-native";

import { HorizontalBarChart } from "@/components/owner/analytics/HorizontalBarChart";
import { DashboardStatCard } from "@/components/owner/DashboardStatCard";
import { PeriodChipSelector } from "@/components/owner/PeriodChipSelector";
import { QueryState } from "@/components/owner/QueryState";
import { RevenueBarChart } from "@/components/owner/RevenueBarChart";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import {
  useCreateExpense,
  useExpenseBreakdown,
  useExpenses,
} from "@/hooks/useOwnerExpenses";
import {
  useRevenueBreakdown,
  useRevenueSummary,
  useStaffPerformanceFinance,
} from "@/hooks/useOwnerFinance";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/lib/format";
import type { FinancePeriodKey, FinanceTabKey } from "@/types/finance";

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
  const [tab, setTab] = useState<FinanceTabKey>("overview");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  const revenue = useRevenueSummary(businessId, period);
  const breakdown = useRevenueBreakdown(businessId, period);
  const staffPerf = useStaffPerformanceFinance(businessId, period);
  const createExpense = useCreateExpense(businessId);

  const range = useMemo(() => {
    const to = new Date().toISOString().slice(0, 10);
    const fromDate = new Date();
    if (period === "today") fromDate.setDate(fromDate.getDate());
    else if (period === "week") fromDate.setDate(fromDate.getDate() - 6);
    else if (period === "month") fromDate.setDate(fromDate.getDate() - 29);
    else fromDate.setDate(fromDate.getDate() - 29);
    return { from: fromDate.toISOString().slice(0, 10), to };
  }, [period]);

  const expensesQuery = useExpenses(businessId, range);
  const expenseBreakdownQuery = useExpenseBreakdown(businessId, range);

  const completedCount = useMemo(() => {
    const services = revenue.data?.income_by_service ?? [];
    return services.reduce((sum, s) => sum + (s.count ?? 0), 0);
  }, [revenue.data]);

  const avgTicket = completedCount > 0 ? (revenue.data?.total_income ?? 0) / completedCount : 0;
  const netProfit = revenue.data?.net_profit ?? (revenue.data?.total_income ?? 0) - (revenue.data?.total_expenses ?? 0);
  const marginPct =
    (revenue.data?.total_income ?? 0) > 0
      ? Math.round((netProfit / (revenue.data?.total_income ?? 1)) * 100)
      : 0;

  const periodChips = useMemo(
    () => [
      { key: "today" as const, label: t("owner.financePeriodToday") },
      { key: "week" as const, label: t("owner.financePeriodWeek") },
      { key: "month" as const, label: t("owner.financePeriodMonth") },
      { key: "custom" as const, label: t("owner.financePeriodCustom") },
    ],
    [t],
  );

  const financeTabs = useMemo(
    () => [
      { key: "overview" as const, label: t("owner.financeTabOverview") },
      { key: "income" as const, label: t("owner.financeTabIncome") },
      { key: "expenses" as const, label: t("owner.financeTabExpenses") },
      { key: "profitability" as const, label: t("owner.financeTabProfitability") },
    ],
    [t],
  );

  const topStaff = (staffPerf.data ?? []).slice().sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  const topServices = (revenue.data?.income_by_service ?? []).slice().sort((a, b) => b.total - a.total).slice(0, 3);

  const paymentMethods = (revenue.data?.income_by_payment_method ?? []).map((m) => ({
    label: m.method,
    value: m.total,
    formatted: formatCurrency(m.total),
  }));

  const expenseChart = (expenseBreakdownQuery.data ?? []).map((e) => ({
    label: e.category,
    value: e.amount,
    formatted: formatCurrency(e.amount),
  }));

  const refreshing = revenue.isRefetching || breakdown.isRefetching || staffPerf.isRefetching;

  const refetchAll = () => {
    void revenue.refetch();
    void breakdown.refetch();
    void staffPerf.refetch();
    void expensesQuery.refetch();
    void expenseBreakdownQuery.refetch();
  };

  const addExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (!expenseDesc.trim() || Number.isNaN(amount)) return;
    createExpense.mutate(
      {
        description: expenseDesc.trim(),
        amount,
        category: "other",
        date: new Date().toISOString().slice(0, 10),
      },
      {
        onSuccess: () => {
          setExpenseDesc("");
          setExpenseAmount("");
        },
      },
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} />}>
      <PeriodChipSelector value={period} chips={periodChips} onChange={setPeriod} />
      <TabChipSelector value={tab} chips={financeTabs} onChange={setTab} />

      <QueryState
        loading={revenue.isLoading}
        error={revenue.isError ? (revenue.error as Error) : null}
        onRetry={refetchAll}>
        {tab === "overview" ? (
          <>
            <View style={styles.grid}>
              <DashboardStatCard label={t("owner.financeTotalRevenue")} value={formatCurrency(revenue.data?.total_income ?? 0)} icon="cash-outline" />
              <DashboardStatCard label={t("owner.financeTotalExpenses")} value={formatCurrency(revenue.data?.total_expenses ?? 0)} icon="trending-down-outline" />
              <DashboardStatCard label={t("owner.financeNetProfit")} value={formatCurrency(netProfit)} icon="wallet-outline" />
              <DashboardStatCard label={t("owner.financeMargin")} value={`${marginPct}%`} icon="pie-chart-outline" />
              <DashboardStatCard label={t("owner.financeCompletedAppts")} value={String(completedCount)} icon="checkmark-circle-outline" />
              <DashboardStatCard label={t("owner.financeTopService")} value={topServiceName(revenue.data?.income_by_service)} icon="cut-outline" />
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
                  <Text style={styles.performerMeta}>{formatCurrency(row.revenue)} · {row.bookings} {t("owner.financeBookings")}</Text>
                </View>
              ))
            )}
            <Text style={styles.section}>{t("owner.financeTopServices")}</Text>
            {topServices.map((row) => (
              <View key={row.service_id} style={styles.performerRow}>
                <Text style={styles.performerName}>{row.service_name}</Text>
                <Text style={styles.performerMeta}>{formatCurrency(row.total)} · {row.count} {t("owner.financeBookings")}</Text>
              </View>
            ))}
          </>
        ) : null}

        {tab === "income" ? (
          <>
            <DashboardStatCard label={t("owner.financeAvgTicket")} value={formatCurrency(avgTicket)} icon="receipt-outline" />
            <Text style={styles.section}>{t("owner.financePaymentMethods")}</Text>
            <HorizontalBarChart items={paymentMethods} emptyLabel={t("owner.financeNoData")} />
          </>
        ) : null}

        {tab === "expenses" ? (
          <>
            <Text style={styles.section}>{t("owner.financeExpenseTrend")}</Text>
            <HorizontalBarChart items={expenseChart} emptyLabel={t("owner.financeNoData")} />
            <Text style={styles.section}>{t("owner.financeAddExpense")}</Text>
            <View style={styles.formCard}>
              <TextInput style={styles.input} value={expenseDesc} onChangeText={setExpenseDesc} placeholder={t("owner.financeExpenseDesc")} />
              <TextInput style={styles.input} value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="decimal-pad" placeholder={t("owner.financeExpenseAmount")} />
              <Pressable style={ownerStyles.primaryBtn} onPress={addExpense}>
                <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
              </Pressable>
            </View>
            {(expensesQuery.data?.expenses ?? []).map((e) => (
              <View key={e.id} style={styles.performerRow}>
                <Text style={styles.performerName}>{e.description}</Text>
                <Text style={styles.performerMeta}>{formatCurrency(e.amount)} · {e.date}</Text>
              </View>
            ))}
          </>
        ) : null}

        {tab === "profitability" ? (
          <>
            <View style={styles.grid}>
              <DashboardStatCard label={t("owner.financeTotalRevenue")} value={formatCurrency(revenue.data?.total_income ?? 0)} icon="cash-outline" />
              <DashboardStatCard label={t("owner.financeTotalExpenses")} value={formatCurrency(revenue.data?.total_expenses ?? 0)} icon="trending-down-outline" />
              <DashboardStatCard label={t("owner.financeNetProfit")} value={formatCurrency(netProfit)} icon="wallet-outline" />
              <DashboardStatCard label={t("owner.financeMargin")} value={`${marginPct}%`} icon="pie-chart-outline" />
            </View>
            <Text style={styles.section}>{t("owner.financeProfitTrend")}</Text>
            <RevenueBarChart data={breakdown.data ?? []} language={language} />
          </>
        ) : null}
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
  formCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.bg,
  },
});
