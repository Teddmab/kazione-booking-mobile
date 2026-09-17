import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { QueryState } from "@/components/owner/QueryState";
import { RevenueBarChart } from "@/components/owner/RevenueBarChart";
import { OwnerAttentionSection } from "@/components/owner/dashboard/OwnerAttentionSection";
import { OwnerCapacityPanel } from "@/components/owner/dashboard/OwnerCapacityPanel";
import { OwnerPeriodPerformanceCard } from "@/components/owner/dashboard/OwnerPeriodPerformanceCard";
import { OwnerScheduleSection } from "@/components/owner/dashboard/OwnerScheduleSection";
import { OwnerStaffTodayPanel } from "@/components/owner/dashboard/OwnerStaffTodayPanel";
import { OwnerTodayKpis } from "@/components/owner/dashboard/OwnerTodayKpis";
import { StaffPerformanceCard } from "@/components/owner/dashboard/StaffPerformanceCard";
import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useLanguage } from "@/hooks/useLanguage";
import { useOwnerAppointments, useOwnerDashboardKPIs } from "@/hooks/useOwnerAppointments";
import {
  useRevenueBreakdown,
  useRevenueSummary,
  useStaffPerformanceFinance,
} from "@/hooks/useOwnerFinance";
import { useOwnerProducts } from "@/hooks/useOwnerProducts";
import { useOwnerReviews } from "@/hooks/useOwnerReviews";
import { useOwnerStaff } from "@/hooks/useOwnerStaff";
import { formatCurrency } from "@/lib/format";
import {
  addDaysToDateStr,
  businessDayOfWeek,
  businessLocalDateStr,
  businessTodayStr,
  computeBusinessPresetRange,
  computeCapacityWeek,
  computeDashboardPeriodMetrics,
  computeFullWeekRange,
  fmtBusinessDateLong,
  fmtDateRangeLabel,
  todaysWorkingHours,
  type PerformancePreset,
} from "@/lib/ownerDashboardLayout";
import type { AppointmentWithRelations } from "@/types/owner";

const PRESETS: PerformancePreset[] = ["thisWeek", "thisMonth", "last30d"];

export default function OwnerDashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { language } = useLanguage();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const tz = tenant?.timezone ?? "UTC";
  const locale = i18n.language || "en";

  const [perfPreset, setPerfPreset] = useState<PerformancePreset>("thisWeek");

  const todayStr = businessTodayStr(tz);
  const dateLabel = fmtBusinessDateLong(todayStr, locale);
  const weekRange = useMemo(() => computeFullWeekRange(todayStr), [todayStr]);
  const perfRange = useMemo(
    () => computeBusinessPresetRange(perfPreset, tz),
    [perfPreset, tz],
  );
  const perfRangeLabel = fmtDateRangeLabel(perfRange.from, perfRange.to, locale);
  const capacityEnd = addDaysToDateStr(todayStr, 6);

  const { data: kpis, isLoading, isError, error, refetch, isRefetching } =
    useOwnerDashboardKPIs(businessId);
  const productsQ = useOwnerProducts(businessId);
  const staffQ = useOwnerStaff(businessId);
  const pendingCompletionQ = useOwnerAppointments(businessId, {
    status: ["pending_completion"],
    limit: 50,
  });
  const weekApptsQ = useOwnerAppointments(businessId, {
    dateFrom: weekRange.from,
    dateTo: weekRange.to,
    limit: 300,
  });
  const capacityApptsQ = useOwnerAppointments(businessId, {
    dateFrom: todayStr,
    dateTo: capacityEnd,
    limit: 500,
  });
  const perfApptsQ = useOwnerAppointments(businessId, {
    dateFrom: perfRange.from,
    dateTo: perfRange.to,
    limit: 500,
  });
  const revenue = useRevenueSummary(businessId, "custom", perfRange);
  const breakdown = useRevenueBreakdown(businessId, "custom", perfRange);
  const staffPerf = useStaffPerformanceFinance(businessId, "custom", perfRange);
  const reviewsQ = useOwnerReviews(businessId, 1);

  const staffList = staffQ.data ?? [];
  const lowStock = (productsQ.data?.products ?? []).filter((p) => p.is_low_stock && p.is_active);
  const pendingInvites = staffList.filter((s) => s.is_pending_invite);
  const needsSetup = staffList.filter(
    (s) => !s.is_pending_invite && !(s.working_hours ?? []).some((d) => d.is_working),
  );
  const pendingCompletion = [...(pendingCompletionQ.data?.appointments ?? [])].sort((a, b) =>
    a.starts_at.localeCompare(b.starts_at),
  );
  const attentionTotal =
    lowStock.length + pendingInvites.length + needsSetup.length + pendingCompletion.length;

  const todayDow = businessDayOfWeek(todayStr);
  const staffOnToday = kpis?.staff_on_today ?? [];
  const staffEntries = staffOnToday.map((s) => {
    const full = staffList.find((sm) => sm.id === s.staff_profile_id);
    const hours = full ? todaysWorkingHours(full.working_hours ?? [], todayDow) : null;
    const end = hours?.end?.slice(0, 5) ?? null;
    return {
      id: s.staff_profile_id,
      display_name: s.display_name,
      avatar_url: full?.avatar_url ?? null,
      until: end ? t("owner.dashUntil", { time: end }) : null,
    };
  });
  const latestEnd = staffEntries
    .map((e) => e.until)
    .filter(Boolean)
    .pop();
  const staffCaption =
    latestEnd ?? t("owner.kpiWorkingTodayCount", { count: staffEntries.length });

  const weekDays = useMemo(() => {
    const days: { date: string; appts: AppointmentWithRelations[] }[] = [];
    for (let i = 0; i < 7; i++) {
      days.push({ date: addDaysToDateStr(weekRange.from, i), appts: [] });
    }
    for (const a of weekApptsQ.data?.appointments ?? []) {
      const iso = businessLocalDateStr(a.starts_at, tz);
      const day = days.find((d) => d.date === iso);
      if (day) day.appts.push(a);
    }
    for (const d of days) d.appts.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return days;
  }, [weekApptsQ.data, weekRange.from, tz]);

  const activeStaff = staffList.filter((s) => s.is_active && !s.is_pending_invite);
  const capacityDays = useMemo(
    () =>
      computeCapacityWeek(
        todayStr,
        activeStaff,
        capacityApptsQ.data?.appointments ?? [],
        tz,
      ),
    [todayStr, activeStaff, capacityApptsQ.data, tz],
  );

  const perfAppts = perfApptsQ.data?.appointments ?? [];
  const perfMetrics = useMemo(() => computeDashboardPeriodMetrics(perfAppts), [perfAppts]);
  const estimatedNet =
    perfMetrics.earned -
    (revenue.data?.total_expenses ?? 0) -
    (staffPerf.data ?? []).reduce((sum, row) => sum + row.commission_amount, 0);

  const attentionCards = [
    ...(pendingCompletion.length
      ? [
          {
            key: "completion",
            tone: "coral" as const,
            icon: "checkmark-circle-outline" as const,
            title: t("owner.attentionCompletions", { count: pendingCompletion.length }),
            detail: pendingCompletion[0]
              ? `${pendingCompletion[0].client.first_name} ${pendingCompletion[0].client.last_name} · ${pendingCompletion[0].service.name}`
              : undefined,
            action: t("owner.attentionReview"),
            onPress: () => router.push("/(app)/owner/(tabs)/appointments" as Href),
          },
        ]
      : []),
    ...(lowStock.length
      ? [
          {
            key: "stock",
            tone: "amber" as const,
            icon: "cube-outline" as const,
            title: t("owner.attentionStock", { count: lowStock.length }),
            chips: lowStock.slice(0, 3).map((p) => p.name),
            action: t("owner.attentionReviewInventory"),
            onPress: () => router.push("/(app)/owner/suppliers" as Href),
          },
        ]
      : []),
    ...(pendingInvites.length + needsSetup.length
      ? [
          {
            key: "staff",
            tone: "violet" as const,
            icon: "people-outline" as const,
            title: t("owner.attentionStaff", {
              count: pendingInvites.length + needsSetup.length,
            }),
            detail: [
              pendingInvites.length
                ? t("owner.attentionInvites", { count: pendingInvites.length })
                : null,
              needsSetup.length
                ? t("owner.attentionSchedules", { count: needsSetup.length })
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
            action: t("owner.attentionReviewStaff"),
            onPress: () => router.push("/(app)/owner/(tabs)/staff" as Href),
          },
        ]
      : []),
  ];

  const refreshAll = () => {
    void refetch();
    void productsQ.refetch();
    void staffQ.refetch();
    void pendingCompletionQ.refetch();
    void weekApptsQ.refetch();
    void capacityApptsQ.refetch();
    void perfApptsQ.refetch();
    void revenue.refetch();
    void breakdown.refetch();
    void staffPerf.refetch();
    void reviewsQ.refetch();
  };

  return (
    <View style={styles.flex}>
      <OwnerAppBar
        title={t("owner.dashboard")}
        subtitle={dateLabel}
        displayTitle
        rightSlot={
          <Pressable
            style={styles.newBtn}
            onPress={() => router.push("/(app)/owner/walk-in" as Href)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.newBtnText}>{t("owner.dashNewBooking")}</Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refreshAll} />}>
        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          onRetry={refreshAll}>
          <Text style={styles.section}>{t("owner.dashToday")}</Text>
          <OwnerTodayKpis
            items={[
              {
                key: "appts",
                value: String(kpis?.today?.total ?? 0),
                label: t("owner.dashTodayAppts"),
                hint: t("owner.kpiRemaining", { count: kpis?.today?.remaining ?? 0 }),
                icon: "calendar-outline",
              },
              {
                key: "staff",
                value: String(staffEntries.length),
                label: t("owner.dashStaffWorking"),
                hint: staffCaption,
                icon: "people-outline",
              },
              {
                key: "attn",
                value: String(attentionTotal),
                label: t("owner.dashNeedsAttention"),
                hint: t("owner.dashAttentionHint", {
                  stock: lowStock.length,
                  staff: pendingInvites.length + needsSetup.length,
                  appt: pendingCompletion.length,
                }),
                icon: "warning-outline",
                warn: attentionTotal > 0,
              },
            ]}
          />

          <OwnerAttentionSection cards={attentionCards} />

          <OwnerScheduleSection
            days={weekDays}
            todayStr={todayStr}
            locale={locale}
            timezone={tz}
            rangeLabel={fmtDateRangeLabel(weekRange.from, weekRange.to, locale)}
            onOpenCalendar={() => router.push("/(app)/owner/(tabs)/appointments" as Href)}
            onOpenAppointments={() =>
              router.push("/(app)/owner/(tabs)/appointments" as Href)
            }
          />

          <OwnerStaffTodayPanel
            entries={staffEntries}
            onViewAll={() => router.push("/(app)/owner/(tabs)/staff" as Href)}
          />
          <OwnerCapacityPanel days={capacityDays} locale={locale} />

          <View style={styles.perfHead}>
            <Text style={styles.section}>{t("owner.dashPerformance")}</Text>
            <View style={styles.presets}>
              {PRESETS.map((p) => {
                const active = perfPreset === p;
                const label =
                  p === "thisWeek"
                    ? t("owner.dashThisWeek")
                    : p === "thisMonth"
                      ? t("owner.dashThisMonth")
                      : t("owner.dashLast30");
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPerfPreset(p)}
                    style={[styles.preset, active && styles.presetOn]}>
                    <Text style={[styles.presetText, active && styles.presetTextOn]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Text style={styles.rangeHint}>{perfRangeLabel}</Text>

          <OwnerPeriodPerformanceCard metrics={perfMetrics} rangeLabel={perfRangeLabel} />

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t("owner.kpiAvgTicket")}</Text>
              <Text style={styles.statValue}>
                {perfMetrics.avgTicket != null ? formatCurrency(perfMetrics.avgTicket) : "—"}
              </Text>
              <Text style={styles.statHint}>{t("owner.dashCompletedServices")}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t("owner.kpiAvgRating")}</Text>
              <Text style={styles.statValue}>
                {(kpis?.avg_rating ?? 0) > 0 ? kpis!.avg_rating.toFixed(1) : "—"}
                {(kpis?.avg_rating ?? 0) > 0 ? " ★" : ""}
              </Text>
              <Text style={styles.statHint}>
                {t("owner.dashReviewCount", { count: reviewsQ.data?.total ?? 0 })}
              </Text>
            </View>
          </View>

          <Text style={styles.subSection}>{t("owner.dashboardRevenueTrend")}</Text>
          <RevenueBarChart data={breakdown.data ?? []} language={language} />

          <StaffPerformanceCard
            rows={staffPerf.data ?? []}
            loading={staffPerf.isLoading}
            rangeLabel={perfRangeLabel}
          />

          <View style={styles.snapshot}>
            <Text style={styles.snapTitle}>{t("owner.dashSnapshot")}</Text>
            <Text style={styles.rangeHint}>{perfRangeLabel}</Text>
            <Text style={styles.snapLine}>
              {formatCurrency(perfMetrics.earned)} {t("owner.dashEarnedInline")}
              {(revenue.data?.total_expenses ?? 0) > 0
                ? ` − ${formatCurrency(revenue.data!.total_expenses)} ${t("owner.dashExpenses")}`
                : ""}
            </Text>
            <Text style={[styles.snapNet, estimatedNet < 0 && styles.snapNeg]}>
              {formatCurrency(estimatedNet)}{" "}
              <Text style={styles.snapNetHint}>{t("owner.dashEstimatedNet")}</Text>
            </Text>
            <Text style={styles.statHint}>{t("owner.dashSnapshotHelper")}</Text>
            <Pressable onPress={() => router.push("/(app)/owner/finance" as Href)}>
              <Text style={styles.link}>{t("owner.dashViewFinance")}</Text>
            </Pressable>
          </View>
        </QueryState>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  section: {
    fontFamily: ownerFonts.semiBold,
    fontSize: 14,
    color: ownerColors.text,
    marginBottom: 10,
  },
  subSection: {
    fontFamily: ownerFonts.semiBold,
    fontSize: 14,
    color: ownerColors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ownerColors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  newBtnText: { color: "#fff", fontSize: 12, fontFamily: ownerFonts.semiBold },
  perfHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  presets: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  preset: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: ownerColors.card },
  presetOn: { backgroundColor: ownerColors.primary },
  presetText: { fontSize: 11, fontFamily: ownerFonts.medium, color: ownerColors.textMuted },
  presetTextOn: { color: "#fff" },
  rangeHint: { fontSize: 12, color: ownerColors.textMuted, marginBottom: 12 },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 16,
  },
  statLabel: { fontSize: 13, fontFamily: ownerFonts.medium, color: ownerColors.textMuted },
  statValue: {
    fontFamily: ownerFonts.bold,
    fontSize: 22,
    color: ownerColors.text,
    marginTop: 4,
  },
  statHint: { fontSize: 11, color: ownerColors.textMuted, marginTop: 4 },
  snapshot: {
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  snapTitle: { fontFamily: ownerFonts.bold, fontSize: 16, color: ownerColors.text },
  snapLine: { fontSize: 12, color: ownerColors.textMuted, marginBottom: 8, lineHeight: 18 },
  snapNet: { fontFamily: ownerFonts.bold, fontSize: 20, color: ownerColors.success, marginBottom: 4 },
  snapNeg: { color: ownerColors.danger },
  snapNetHint: { fontSize: 11, fontFamily: ownerFonts.regular, color: ownerColors.textMuted },
  link: { fontSize: 12, fontFamily: ownerFonts.medium, color: ownerColors.primary, marginTop: 10 },
});
