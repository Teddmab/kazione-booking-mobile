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

import { DashboardStatCard } from "@/components/owner/DashboardStatCard";
import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { QueryState } from "@/components/owner/QueryState";
import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerDashboardKPIs } from "@/hooks/useOwnerAppointments";
import { formatCurrency, formatDateLong, formatTime } from "@/lib/format";

export default function OwnerDashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data: kpis, isLoading, isError, error, refetch, isRefetching } =
    useOwnerDashboardKPIs(businessId);

  const todayLabel = formatDateLong(new Date(), i18n.language);
  const upcoming = kpis?.upcoming_today ?? [];
  const staffToday = kpis?.staff_on_today?.length ?? 0;
  const monthTotal = kpis?.this_month?.total ?? 0;
  const monthRevenue = kpis?.this_month?.revenue ?? 0;
  const avgTicket = monthTotal > 0 ? monthRevenue / monthTotal : 0;
  const avgRating = kpis?.avg_rating ?? 0;
  const completionRate = kpis?.completion_rate_30d ?? 0;

  const confirmedCount = upcoming.filter((a) => a.status === "confirmed").length;
  const pendingCount = upcoming.filter(
    (a) => a.status === "pending" || a.status === "pending_payment",
  ).length;

  return (
    <View style={styles.flex}>
      <OwnerAppBar
        title={t("owner.dashboard")}
        subtitle={todayLabel}
        serifTitle
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }>
        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          onRetry={() => void refetch()}>
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
              value={String(staffToday)}
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("owner.todayAppointments")}</Text>
          <View style={styles.chips}>
            <View style={[styles.chip, styles.chipGreen]}>
              <Text style={styles.chipGreenText}>
                {t("owner.confirmedCount", { count: confirmedCount })}
              </Text>
            </View>
            <View style={[styles.chip, styles.chipOrange]}>
              <Text style={styles.chipOrangeText}>
                {t("owner.pendingCount", { count: pendingCount })}
              </Text>
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
              <Text style={styles.apptMeta}>
                {a.service_name} · {a.staff_name}
              </Text>
            </Pressable>
          ))
        )}

        <Pressable
          style={styles.walkInCard}
          onPress={() => router.push("/(app)/owner/walk-in" as Href)}>
          <Text style={styles.walkInTitle}>{t("owner.walkInTitle")}</Text>
          <Text style={styles.walkInSub}>{t("owner.walkInSub")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 16, paddingBottom: 24 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: ownerFonts.serif,
    fontSize: 22,
    fontWeight: "700",
    color: ownerColors.text,
  },
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
  apptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  apptTime: { fontSize: 15, fontWeight: "700", color: ownerColors.primary },
  apptClient: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  apptMeta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
  walkInCard: {
    backgroundColor: ownerColors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  walkInTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  walkInSub: { fontSize: 13, color: "rgba(255,255,255,0.88)", marginTop: 4 },
});
