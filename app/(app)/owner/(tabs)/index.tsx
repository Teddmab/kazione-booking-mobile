import { useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";

import { HorizontalBarChart } from "@/components/owner/analytics/HorizontalBarChart";
import { SectionHeader } from "@/components/owner/analytics/SectionHeader";
import { WeekBreakdownBar } from "@/components/owner/analytics/WeekBreakdownBar";
import { DashboardStatCard } from "@/components/owner/DashboardStatCard";
import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { QueryState } from "@/components/owner/QueryState";
import { RevenueBarChart } from "@/components/owner/RevenueBarChart";
import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerDashboardKPIs } from "@/hooks/useOwnerAppointments";
import { useRevenueBreakdown, useRevenueSummary } from "@/hooks/useOwnerFinance";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency, formatDateLong, formatTime } from "@/lib/format";

export default function OwnerDashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { language } = useLanguage();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  const { data: kpis, isLoading, isError, error, refetch, isRefetching } =
    useOwnerDashboardKPIs(businessId);
  const revenue = useRevenueSummary(businessId, "month");
  const breakdown = useRevenueBreakdown(businessId, "month");

  const todayLabel = formatDateLong(new Date(), i18n.language);
  const upcoming = kpis?.upcoming_today ?? [];
  const staffOnToday = kpis?.staff_on_today ?? [];
  const monthTotal = kpis?.this_month?.total ?? 0;
  const monthRevenue = kpis?.this_month?.revenue ?? 0;
  const avgTicket = monthTotal > 0 ? monthRevenue / monthTotal : 0;
  const avgRating = kpis?.avg_rating ?? 0;
  const completionRate = kpis?.completion_rate_30d ?? 0;

  const weekTotal = kpis?.this_week?.total ?? 0;
  const weekCompleted = kpis?.this_week?.completed ?? 0;
  const weekCancelled = kpis?.this_week?.cancelled ?? 0;
  const weekPending = Math.max(0, weekTotal - weekCompleted - weekCancelled);

  const confirmedCount = upcoming.filter((a) => a.status === "confirmed").length;
  const pendingCount = upcoming.filter(
    (a) => a.status === "pending" || a.status === "pending_payment",
  ).length;

  const topServices = (revenue.data?.income_by_service ?? [])
    .slice()
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((s) => ({ label: s.service_name, value: s.total, formatted: formatCurrency(s.total) }));

  const busyHours = aggregateBusyHours(upcoming);

  const refreshAll = () => {
    void refetch();
    void revenue.refetch();
    void breakdown.refetch();
  };

  return (
    <View style={styles.flex}>
      <OwnerAppBar title={t("owner.dashboard")} subtitle={todayLabel} displayTitle />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refreshAll} />}>
        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          onRetry={refreshAll}>
          <View style={styles.statsGrid}>
            <DashboardStatCard
              label={t("owner.kpiTodayBookings")}
              value={String(kpis?.today?.total ?? 0)}
              hint={t("owner.kpiRemaining", { count: kpis?.today?.remaining ?? 0 })}
              icon="calendar-outline"
            />
            <DashboardStatCard
              label={t("owner.kpiWeeklyRevenue")}
              value={formatCurrency(kpis?.this_week?.revenue ?? 0)}
              hint={t("owner.kpiCompleted", { count: kpis?.this_week?.completed ?? 0 })}
              hintSuccess
              icon="card-outline"
            />
            <DashboardStatCard
              label={t("owner.kpiMonthlyRevenue")}
              value={formatCurrency(monthRevenue)}
              hint={t("owner.kpiBookings", { count: monthTotal })}
              hintSuccess
              icon="trending-up-outline"
            />
            <DashboardStatCard
              label={t("owner.kpiActiveStaff")}
              value={String(staffOnToday.length)}
              hint={t("owner.kpiWorkingToday")}
              icon="people-outline"
            />
            <DashboardStatCard
              label={t("owner.kpiAvgTicket")}
              value={formatCurrency(avgTicket)}
              hint={t("owner.kpiThisMonth")}
              icon="cash-outline"
            />
            <DashboardStatCard
              label={t("owner.kpiAvgRating")}
              value={avgRating > 0 ? avgRating.toFixed(1) : t("owner.kpiNoReviews")}
              hint={t("owner.kpiCompletion", { percent: Math.round(completionRate) })}
              hintSuccess={completionRate > 0}
              icon="star-outline"
            />
          </View>
        </QueryState>

        {staffOnToday.length > 0 ? (
          <>
            <SectionHeader title={t("owner.dashboardStaffToday")} />
            <View style={styles.staffRow}>
              {staffOnToday.map((s) => (
                <View key={s.staff_profile_id} style={styles.staffChip}>
                  <Text style={styles.staffInitial}>{s.display_name[0]?.toUpperCase() ?? "?"}</Text>
                  <Text style={styles.staffName} numberOfLines={1}>{s.display_name}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <SectionHeader title={t("owner.dashboardWeekBreakdown")} />
        <WeekBreakdownBar
          pending={weekPending}
          completed={weekCompleted}
          cancelled={weekCancelled}
          labels={{
            pending: t("owner.pending"),
            completed: t("owner.txStatus_completed"),
            cancelled: t("owner.txStatus_cancelled"),
          }}
        />

        <SectionHeader title={t("owner.dashboardRevenueTrend")} />
        <RevenueBarChart data={breakdown.data ?? []} language={language} />

        <SectionHeader title={t("owner.dashboardTopServices")} />
        <HorizontalBarChart items={topServices} emptyLabel={t("owner.financeNoData")} />

        {busyHours.length > 0 ? (
          <>
            <SectionHeader title={t("owner.dashboardBusyTimes")} />
            <HorizontalBarChart items={busyHours} emptyLabel={t("owner.financeNoData")} />
          </>
        ) : null}

        <Pressable
          style={styles.aiTeaser}
          onPress={() => router.push("/(app)/owner/ai-insights" as Href)}>
          <Text style={styles.aiTeaserTitle}>{t("owner.aiInsights")}</Text>
          <Text style={styles.aiTeaserSub}>{t("owner.dashboardAiTeaser")}</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("owner.todayAppointments")}</Text>
          <View style={styles.chips}>
            <View style={[styles.chip, styles.chipGreen]}>
              <Text style={styles.chipGreenText}>{t("owner.confirmedCount", { count: confirmedCount })}</Text>
            </View>
            <View style={[styles.chip, styles.chipOrange]}>
              <Text style={styles.chipOrangeText}>{t("owner.pendingCount", { count: pendingCount })}</Text>
            </View>
          </View>
        </View>

        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.empty}>{t("owner.noAppointmentsToday")}</Text>
          </View>
        ) : (
          upcoming.slice(0, 6).map((a) => (
            <Pressable
              key={a.id}
              style={styles.apptCard}
              onPress={() => router.push("/(app)/owner/(tabs)/appointments" as Href)}>
              <View style={styles.apptRow}>
                <Text style={styles.apptTime}>{formatTime(a.starts_at)}</Text>
                <StatusBadge status={a.status} />
              </View>
              <Text style={styles.apptClient}>{a.client_name}</Text>
              <Text style={styles.apptMeta}>{a.service_name} · {a.staff_name}</Text>
            </Pressable>
          ))
        )}

        <Pressable style={styles.walkInCard} onPress={() => router.push("/(app)/owner/walk-in" as Href)}>
          <Text style={styles.walkInTitle}>{t("owner.walkInTitle")}</Text>
          <Text style={styles.walkInSub}>{t("owner.walkInSub")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function aggregateBusyHours(appointments: { starts_at: string }[]) {
  const buckets = new Map<number, number>();
  for (const a of appointments) {
    const h = new Date(a.starts_at).getHours();
    buckets.set(h, (buckets.get(h) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hour, count]) => ({ label: `${hour}h`, value: count }));
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 16, paddingBottom: 24 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 },
  staffRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  staffChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ownerColors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ownerColors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: "48%",
  },
  staffInitial: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ownerColors.primaryMuted,
    textAlign: "center",
    lineHeight: 28,
    fontWeight: "700",
    color: ownerColors.primary,
  },
  staffName: { fontSize: 13, color: ownerColors.text, flex: 1 },
  aiTeaser: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  aiTeaserTitle: { fontSize: 16, fontWeight: "700", color: ownerColors.text },
  aiTeaserSub: { fontSize: 13, color: ownerColors.primary, marginTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: ownerFonts.bold, fontSize: 22, fontWeight: "700", color: ownerColors.text },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  chipGreen: { backgroundColor: ownerColors.successMuted },
  chipGreenText: { fontSize: 12, fontWeight: "600", color: ownerColors.success },
  chipOrange: { backgroundColor: ownerColors.warningMuted },
  chipOrangeText: { fontSize: 12, fontWeight: "600", color: ownerColors.warning },
  emptyCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderStyle: "dashed",
    padding: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  empty: { fontSize: 15, color: ownerColors.textMuted, textAlign: "center" },
  apptCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  apptRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  apptTime: { fontSize: 15, fontWeight: "700", color: ownerColors.primary },
  apptClient: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  apptMeta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
  walkInCard: { backgroundColor: ownerColors.primary, borderRadius: 12, padding: 16, marginTop: 8 },
  walkInTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  walkInSub: { fontSize: 13, color: "rgba(255,255,255,0.88)", marginTop: 4 },
});
