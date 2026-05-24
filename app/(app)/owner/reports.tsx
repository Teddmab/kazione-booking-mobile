import { useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { HorizontalBarChart } from "@/components/owner/analytics/HorizontalBarChart";
import { SegmentBarChart } from "@/components/owner/analytics/SegmentBarChart";
import { DashboardStatCard } from "@/components/owner/DashboardStatCard";
import { ExportReportSheet } from "@/components/owner/ExportReportSheet";
import { QueryState } from "@/components/owner/QueryState";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { TransactionRow } from "@/components/owner/TransactionRow";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerClients } from "@/hooks/useOwnerClients";
import {
  useRevenueBreakdown,
  useRevenueSummary,
  useStaffPerformanceFinance,
  useTransactions,
} from "@/hooks/useOwnerFinance";
import { useOwnerDashboardKPIs } from "@/hooks/useOwnerAppointments";
import { computeClientKPIs } from "@/lib/clientStatus";
import { dateRangeForReportPeriod } from "@/lib/reportPeriod";
import { formatCurrency } from "@/lib/format";
import type { ReportPeriodKey, ReportsTabKey, TransactionStatusFilter } from "@/types/finance";

const STATUS_FILTERS: TransactionStatusFilter[] = ["all", "completed", "cancelled", "refunded"];

export default function OwnerReportsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  const [reportPeriod, setReportPeriod] = useState<ReportPeriodKey>("30d");
  const [tab, setTab] = useState<ReportsTabKey>("bookings");
  const [status, setStatus] = useState<TransactionStatusFilter>("all");
  const [exportOpen, setExportOpen] = useState(false);

  const dateRange = useMemo(() => dateRangeForReportPeriod(reportPeriod), [reportPeriod]);
  const tx = useTransactions(businessId, status, dateRange);
  const revenue = useRevenueSummary(businessId, "custom", dateRange);
  const breakdown = useRevenueBreakdown(businessId, "custom", dateRange);
  const staffPerf = useStaffPerformanceFinance(businessId, "custom", dateRange);
  const kpis = useOwnerDashboardKPIs(businessId);
  const clients = useOwnerClients(businessId, { limit: 200 });

  const appointments = useMemo(() => tx.data?.pages.flatMap((p) => p.appointments) ?? [], [tx.data]);
  const clientList = clients.data?.clients ?? [];
  const clientKpis = computeClientKPIs(clientList, clients.data?.total ?? clientList.length);

  const reportTabs = useMemo(
    () => [
      { key: "bookings" as const, label: t("owner.reportsTabBookings") },
      { key: "clients" as const, label: t("owner.reportsTabClients") },
      { key: "staff" as const, label: t("owner.reportsTabStaff") },
      { key: "revenue" as const, label: t("owner.reportsTabRevenue") },
      { key: "services" as const, label: t("owner.reportsTabServices") },
      { key: "transactions" as const, label: t("owner.reportsTabTransactions") },
    ],
    [t],
  );

  const periodChips = useMemo(
    () => [
      { key: "7d" as const, label: "7d" },
      { key: "30d" as const, label: "30d" },
      { key: "90d" as const, label: "90d" },
      { key: "ytd" as const, label: "YTD" },
    ],
    [],
  );

  const openExport = useCallback(() => setExportOpen(true), []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={openExport} style={styles.exportBtn}>
          <Text style={styles.exportText}>{t("owner.export")}</Text>
        </Pressable>
      ),
    });
  }, [navigation, openExport, t]);

  const serviceChart = (revenue.data?.income_by_service ?? []).map((s) => ({
    label: s.service_name,
    value: s.total,
    formatted: formatCurrency(s.total),
  }));

  const clientSegments = [
    { label: "VIP", value: clientKpis.vip, color: ownerColors.primary },
    { label: t("owner.clientFilterActive"), value: clientKpis.active, color: ownerColors.success },
    { label: t("owner.clientFilterNew"), value: clientKpis.new, color: ownerColors.warning },
    { label: t("owner.clientFilterAtRisk"), value: clientKpis.atRisk, color: ownerColors.danger },
  ];

  if (tab === "transactions") {
    return (
      <View style={styles.flex}>
        <View style={styles.filters}>
          <TabChipSelector value={tab} chips={reportTabs} onChange={setTab} />
          <View style={styles.statusRow}>
            {STATUS_FILTERS.map((s) => (
              <Pressable key={s} style={[styles.statusChip, status === s && styles.statusChipActive]} onPress={() => setStatus(s)}>
                <Text style={[styles.statusText, status === s && styles.statusTextActive]}>{t(`owner.txStatus_${s}`)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <QueryState loading={tx.isLoading} error={tx.isError ? (tx.error as Error) : null} onRetry={() => void tx.refetch()}>
          <FlatList
            data={appointments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TransactionRow item={item} />}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={tx.isRefetching} onRefresh={() => void tx.refetch()} />}
            ListEmptyComponent={<Text style={styles.empty}>{t("owner.financeNoTransactions")}</Text>}
            ListFooterComponent={
              tx.hasNextPage ? (
                <Pressable style={styles.loadMore} onPress={() => void tx.fetchNextPage()} disabled={tx.isFetchingNextPage}>
                  <Text style={styles.loadMoreText}>{tx.isFetchingNextPage ? t("common.loading") : t("owner.loadMore")}</Text>
                </Pressable>
              ) : null
            }
          />
        </QueryState>
        <ExportReportSheet visible={exportOpen} businessId={businessId} onClose={() => setExportOpen(false)} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.analyticsScroll}>
      <TabChipSelector value={reportPeriod} chips={periodChips} onChange={setReportPeriod} />
      <TabChipSelector value={tab} chips={reportTabs} onChange={setTab} />

      {tab === "bookings" ? (
        <View style={styles.grid}>
          <DashboardStatCard label={t("owner.reportsTotalBookings")} value={String(kpis.data?.this_month?.total ?? 0)} icon="calendar-outline" />
          <DashboardStatCard label={t("owner.kpiCompleted", { count: kpis.data?.this_week?.completed ?? 0 })} value={String(kpis.data?.this_week?.completed ?? 0)} icon="checkmark-circle-outline" />
          <DashboardStatCard label={t("owner.txStatus_cancelled")} value={String(kpis.data?.this_week?.cancelled ?? 0)} icon="close-circle-outline" />
        </View>
      ) : null}

      {tab === "clients" ? (
        <>
          <View style={styles.grid}>
            <DashboardStatCard label={t("owner.clientsTotal")} value={String(clientKpis.total)} icon="people-outline" />
            <DashboardStatCard label={t("owner.clientFilterNew")} value={String(clientKpis.new)} icon="person-add-outline" />
            <DashboardStatCard label={t("owner.clientFilterActive")} value={String(clientKpis.active)} icon="heart-outline" />
            <DashboardStatCard label="VIP" value={String(clientKpis.vip)} icon="star-outline" />
          </View>
          <Text style={styles.section}>{t("owner.reportsClientSegments")}</Text>
          <SegmentBarChart segments={clientSegments} />
        </>
      ) : null}

      {tab === "staff" ? (
        (staffPerf.data ?? []).map((row) => (
          <View key={row.staff_profile_id} style={styles.row}>
            <Text style={styles.rowTitle}>{row.display_name}</Text>
            <Text style={styles.rowMeta}>{formatCurrency(row.revenue)} · {row.bookings} {t("owner.financeBookings")} · {Math.round(row.completion_rate * 100)}%</Text>
          </View>
        ))
      ) : null}

      {tab === "revenue" ? (
        <>
          <View style={styles.grid}>
            <DashboardStatCard label={t("owner.financeTotalRevenue")} value={formatCurrency(revenue.data?.total_income ?? 0)} icon="cash-outline" />
            <DashboardStatCard label={t("owner.financeNetProfit")} value={formatCurrency(revenue.data?.net_profit ?? 0)} icon="wallet-outline" />
          </View>
          <Text style={styles.section}>{t("owner.dashboardRevenueTrend")}</Text>
          <HorizontalBarChart
            items={(breakdown.data ?? []).map((d) => ({ label: d.period.slice(5), value: d.amount, formatted: formatCurrency(d.amount) }))}
            emptyLabel={t("owner.financeNoData")}
          />
        </>
      ) : null}

      {tab === "services" ? (
        <>
          <Text style={styles.section}>{t("owner.financeTopServices")}</Text>
          <HorizontalBarChart items={serviceChart} emptyLabel={t("owner.financeNoData")} />
        </>
      ) : null}

      <ExportReportSheet visible={exportOpen} businessId={businessId} onClose={() => setExportOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  analyticsScroll: { padding: 16, paddingBottom: 40 },
  filters: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
  },
  statusChipActive: { borderColor: ownerColors.primary, backgroundColor: ownerColors.primaryMuted },
  statusText: { fontSize: 12, fontWeight: "600", color: ownerColors.textMuted },
  statusTextActive: { color: ownerColors.primary },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: "center", color: ownerColors.textMuted, marginTop: 40, fontSize: 15 },
  loadMore: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
  },
  loadMoreText: { fontSize: 14, fontWeight: "600", color: ownerColors.primary },
  exportBtn: { marginRight: 12, paddingVertical: 6, paddingHorizontal: 4 },
  exportText: { fontSize: 15, fontWeight: "600", color: ownerColors.primary },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 12 },
  section: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 10,
  },
  row: {
    backgroundColor: ownerColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 12,
    marginBottom: 8,
  },
  rowTitle: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  rowMeta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
});
