import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";

import { QueryState } from "@/components/owner/QueryState";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { StaffEarningsPanel } from "@/components/staff/StaffEarningsPanel";
import { ownerFonts, ownerStyles } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useTenantContext } from "@/contexts/TenantContext";
import {
  periodRange,
  useMyPerformance,
  type PeriodKey,
} from "@/hooks/useMyPerformance";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useStaffAppointments } from "@/hooks/useStaffAppointments";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import { zonedDateKey } from "@/lib/businessTime";
import { formatCurrency } from "@/lib/format";
import type { StaffAppointment } from "@/services/staff/appointments";
import type { StaffPerformance } from "@/services/staff/profile";

type ScreenTab = "overview" | "earnings";

const PERIOD_LABEL_KEYS: Record<PeriodKey, string> = {
  "7d": "staffPerf.periodWeek",
  "30d": "staffPerf.periodMonth",
  "90d": "staffPerf.periodCustom",
};

function weekdayShort(locale: string, mondayBasedIndex: number): string {
  const date = new Date(2024, 0, 1 + mondayBasedIndex);
  return date.toLocaleDateString(locale, { weekday: "short" }).replace(/\.$/, "");
}

function completionPct(rate: number | undefined | null): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

/** Activity by weekday in business timezone (Mon→Sun). */
function buildWeeklyActivity(
  appts: StaffAppointment[],
  locale: string,
  timeZone: string,
) {
  const counts = Array(7).fill(0) as number[];
  for (const a of appts) {
    if (a.status === "cancelled") continue;
    const key = zonedDateKey(a.starts_at, timeZone);
    const d = new Date(`${key}T12:00:00`);
    const jsDay = d.getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    counts[idx] += 1;
  }
  return counts.map((count, i) => ({
    name: weekdayShort(locale, i),
    count,
  }));
}

function buildTopServices(appts: StaffAppointment[]) {
  const map = new Map<string, { name: string; count: number }>();
  for (const a of appts) {
    if (a.status === "cancelled" || a.status === "no_show") continue;
    const key = a.service.id;
    const existing = map.get(key);
    if (existing) existing.count += 1;
    else map.set(key, { name: a.service.name, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
}

function buildPeriodTrend(appts: StaffAppointment[], timeZone: string) {
  const weekMap: Record<
    string,
    { week: string; completed: number; cancelled: number; total: number }
  > = {};
  for (const a of appts) {
    const keyDate = zonedDateKey(a.starts_at, timeZone);
    const d = new Date(`${keyDate}T12:00:00`);
    const weekNum = Math.ceil(d.getDate() / 7);
    const key = `W${weekNum}`;
    if (!weekMap[key]) {
      weekMap[key] = { week: key, completed: 0, cancelled: 0, total: 0 };
    }
    weekMap[key].total += 1;
    if (a.status === "completed") weekMap[key].completed += 1;
    if (a.status === "cancelled") weekMap[key].cancelled += 1;
  }
  return Object.values(weekMap).sort(
    (a, b) => Number(a.week.slice(1)) - Number(b.week.slice(1)),
  );
}

/** Derive activity stats from appointments so UI matches Today (not only completed). */
function deriveActivityStats(appts: StaffAppointment[], api: StaffPerformance | null | undefined) {
  const active = appts.filter(
    (a) => a.status !== "cancelled" && a.status !== "no_show",
  );
  const completed = appts.filter((a) => a.status === "completed");
  const uniqueClients = new Set(
    active.map((a) => a.client?.id).filter(Boolean),
  ).size;
  const revenueFromCompleted = completed.reduce(
    (s, a) => s + Number(a.price ?? 0),
    0,
  );
  const completionRate =
    active.length > 0 ? completed.length / active.length : 0;

  return {
    bookings: active.length,
    unique_clients: uniqueClients || (api?.unique_clients ?? 0),
    completion_rate: api?.completion_rate ?? completionRate,
    avg_rating: api?.avg_rating ?? 0,
    revenue: api?.revenue ?? revenueFromCompleted,
    commission_amount: api?.commission_amount ?? 0,
    referrals_initiated: api?.referrals_initiated ?? 0,
    referral_conversions: api?.referral_conversions ?? 0,
    referral_revenue: api?.referral_revenue ?? 0,
    display_name: api?.display_name,
  };
}

function PeriodSelector({
  value,
  onChange,
  styles,
}: {
  value: PeriodKey;
  onChange: (p: PeriodKey) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { t } = useTranslation();
  const periods: PeriodKey[] = ["7d", "30d", "90d"];

  return (
    <View style={styles.periodRow}>
      {periods.map((key) => {
        const active = value === key;
        return (
          <Pressable
            key={key}
            style={[styles.periodChip, active && styles.periodChipActive]}
            onPress={() => onChange(key)}>
            <Text
              style={[styles.periodText, active && styles.periodTextActive]}>
              {t(PERIOD_LABEL_KEYS[key])}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StatsRow({
  stats,
  loading,
  styles,
}: {
  stats: ReturnType<typeof deriveActivityStats> | null;
  loading: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { t } = useTranslation();
  const cells = [
    {
      label: t("staffPerf.statAppts"),
      value: loading ? "…" : stats ? String(stats.bookings) : "—",
    },
    {
      label: t("staffPerf.statClients"),
      value: loading ? "…" : stats ? String(stats.unique_clients) : "—",
    },
    {
      label: t("staffPerf.statCompletion"),
      value: loading ? "…" : completionPct(stats?.completion_rate),
    },
    {
      label: t("staffPerf.statRating"),
      value: loading
        ? "…"
        : stats && stats.avg_rating > 0
          ? `${stats.avg_rating.toFixed(1)} ★`
          : "—",
    },
  ];

  return (
    <View style={styles.statsRow}>
      {cells.map((c) => (
        <View key={c.label} style={styles.statCard}>
          <Text style={styles.statValue}>{c.value}</Text>
          <Text style={styles.statLabel}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

function WeeklyActivityChart({
  data,
  styles,
}: {
  data: { name: string; count: number }[];
  styles: ReturnType<typeof makeStyles>;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <View style={styles.chartRow}>
      {data.map(({ name, count }) => (
        <View key={name} style={styles.chartCol}>
          <Text style={styles.chartCount}>{count || ""}</Text>
          <View
            style={[
              styles.chartBar,
              {
                height: Math.max((count / max) * 60, count > 0 ? 4 : 0),
              },
            ]}
          />
          <Text style={styles.chartDay}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

function TopServicesList({
  data,
  styles,
}: {
  data: { name: string; count: number }[];
  styles: ReturnType<typeof makeStyles>;
}) {
  const max = data[0]?.count ?? 1;
  return (
    <View style={{ gap: 10 }}>
      {data.map((row) => (
        <View key={row.name}>
          <View style={styles.topRow}>
            <Text style={styles.topName} numberOfLines={1}>
              {row.name}
            </Text>
            <Text style={styles.topCount}>{row.count}</Text>
          </View>
          <View style={styles.topTrack}>
            <View
              style={[
                styles.topFill,
                { width: `${Math.max((row.count / max) * 100, 4)}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function BookingTrendChart({
  data,
  styles,
}: {
  data: { week: string; completed: number; cancelled: number; total: number }[];
  styles: ReturnType<typeof makeStyles>;
}) {
  const { t } = useTranslation();
  const max = Math.max(...data.map((d) => d.completed), 1);
  return (
    <View>
      <View style={styles.chartRow}>
        {data.map(({ week, completed }) => (
          <View key={week} style={styles.chartCol}>
            <Text style={styles.chartCount}>{completed || ""}</Text>
            <View
              style={[
                styles.chartBar,
                styles.trendBar,
                {
                  height: Math.max(
                    (completed / max) * 60,
                    completed > 0 ? 4 : 0,
                  ),
                },
              ]}
            />
            <Text style={styles.chartDay}>{week}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.trendLegend}>{t("staffPerf.completed")}</Text>
    </View>
  );
}

export default function StaffPerformanceScreen() {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { tenant } = useTenantContext();
  const timeZone = tenant?.timezone ?? "Europe/Tallinn";
  const { data: self } = useStaffSelf();
  const settings = useBusinessSettings(tenant?.businessId ?? "");
  const currency = settings.data?.settings?.currency_code ?? "EUR";

  const initialTab: ScreenTab =
    params.tab === "overview" ? "overview" : "earnings";
  const [tab, setTab] = useState<ScreenTab>(initialTab);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [earningsRefreshNonce, setEarningsRefreshNonce] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  useEffect(() => {
    setTab(params.tab === "overview" ? "overview" : "earnings");
  }, [params.tab]);

  const {
    data: perf,
    isLoading,
    isError,
    error,
    refetch,
  } = useMyPerformance(period);

  const { from, to } = periodRange(period);
  const {
    data: appointments = [],
    refetch: refetchAppts,
    isLoading: apptsLoading,
  } = useStaffAppointments(from, to, 500);

  const activityStats = useMemo(
    () => deriveActivityStats(appointments, perf),
    [appointments, perf],
  );

  const weeklyActivity = useMemo(
    () => buildWeeklyActivity(appointments, i18n.language, timeZone),
    [appointments, i18n.language, timeZone],
  );
  const topServices = useMemo(
    () => buildTopServices(appointments),
    [appointments],
  );
  const periodTrend = useMemo(
    () => buildPeriodTrend(appointments, timeZone),
    [appointments, timeZone],
  );

  function selectTab(next: ScreenTab) {
    setTab(next);
    router.replace(
      (next === "overview"
        ? "/(app)/staff/(tabs)/performance?tab=overview"
        : "/(app)/staff/(tabs)/performance") as Href,
    );
  }

  async function onRefresh() {
    setPullRefreshing(true);
    try {
      if (tab === "earnings") {
        setEarningsRefreshNonce((n) => n + 1);
        return;
      }
      await Promise.all([refetch(), refetchAppts()]);
    } finally {
      setPullRefreshing(false);
    }
  }

  const statsLoading = isLoading && apptsLoading && !perf && appointments.length === 0;

  return (
    <View style={styles.screen}>
      <StaffAppBar
        title={
          tab === "earnings" ? t("staffEarnings.title") : t("staffPerf.title")
        }
        subtitle={
          activityStats.display_name ?? self?.display_name ?? undefined
        }
        displayTitle
        onBack={tab === "overview" ? () => selectTab("earnings") : undefined}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
          />
        }>
        {tab === "earnings" ? (
          <StaffEarningsPanel
            refreshNonce={earningsRefreshNonce}
            onOpenPerformance={() => selectTab("overview")}
            onOpenPayoutDetail={() =>
              router.push("/(app)/staff/(tabs)/profile" as Href)
            }
          />
        ) : (
          <>
            <PeriodSelector value={period} onChange={setPeriod} styles={styles} />

            <QueryState
              loading={false}
              error={isError ? (error as Error) : null}
              empty={false}
              onRetry={() => void refetch()}>
              <StatsRow
                stats={activityStats}
                loading={statsLoading}
                styles={styles}
              />

              <View style={styles.moneyRow}>
                <View style={styles.moneyCard}>
                  <Text style={styles.moneyLabel}>
                    {t("staffToday.serviceValue")}
                  </Text>
                  <Text style={styles.moneyValue}>
                    {formatCurrency(
                      activityStats.revenue,
                      currency,
                      i18n.language,
                    )}
                  </Text>
                </View>
                <View style={styles.moneyCard}>
                  <Text style={styles.moneyLabel}>
                    {t("staffToday.commissionEarned")}
                  </Text>
                  <Text style={[styles.moneyValue, { color: colors.primary }]}>
                    {formatCurrency(
                      activityStats.commission_amount,
                      currency,
                      i18n.language,
                    )}
                  </Text>
                </View>
              </View>

              {statsLoading ? (
                <ActivityIndicator
                  style={{ marginVertical: 16 }}
                  color={colors.primary}
                />
              ) : null}

              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t("staffPerf.activity")}</Text>
                <WeeklyActivityChart data={weeklyActivity} styles={styles} />
              </View>

              {periodTrend.length > 1 ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{t("staffPerf.bookingTrend")}</Text>
                  <BookingTrendChart data={periodTrend} styles={styles} />
                </View>
              ) : null}

              {topServices.length > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{t("staffPerf.topServices")}</Text>
                  <TopServicesList data={topServices} styles={styles} />
                </View>
              ) : null}

              {(activityStats.referrals_initiated > 0 ||
                activityStats.referral_conversions > 0) ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{t("staffPerf.referrals")}</Text>
                  <View style={styles.refRow}>
                    <Text style={styles.refLabel}>
                      {t("staffPerf.referralsInitiated")}
                    </Text>
                    <Text style={styles.refValue}>
                      {activityStats.referrals_initiated}
                    </Text>
                  </View>
                  <View style={styles.refRow}>
                    <Text style={styles.refLabel}>
                      {t("staffPerf.referralConversions")}
                    </Text>
                    <Text style={styles.refValue}>
                      {activityStats.referral_conversions}
                    </Text>
                  </View>
                  <View style={styles.refRow}>
                    <Text style={styles.refLabel}>
                      {t("staffPerf.referralRevenue")}
                    </Text>
                    <Text style={styles.refValue}>
                      {formatCurrency(
                        activityStats.referral_revenue,
                        currency,
                        i18n.language,
                      )}
                    </Text>
                  </View>
                </View>
              ) : null}

              {!statsLoading &&
              activityStats.bookings === 0 &&
              appointments.length === 0 ? (
                <Text style={styles.emptyHint}>{t("staffPerf.noData")}</Text>
              ) : null}
            </QueryState>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40, gap: 12 },
    periodRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
    periodChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 7,
      backgroundColor: colors.card,
    },
    periodChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    periodText: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    periodTextActive: {
      color: "#fff",
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    statsRow: { flexDirection: "row", gap: 8 },
    statCard: {
      flex: 1,
      backgroundColor: colors.primarySurface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 4,
      alignItems: "center",
    },
    statValue: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: ownerFonts.bold,
    },
    statLabel: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.medium,
    },
    moneyRow: { flexDirection: "row", gap: 8 },
    moneyCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 4,
    },
    moneyLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    moneyValue: {
      fontSize: 18,
      fontFamily: ownerFonts.bold,
      color: colors.text,
    },
    card: {
      ...ownerStyles.card,
      marginBottom: 0,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 10,
      fontFamily: ownerFonts.bold,
    },
    chartRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      height: 100,
      gap: 4,
      paddingHorizontal: 4,
    },
    chartCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
    chartCount: {
      fontSize: 10,
      color: colors.text,
      marginBottom: 2,
      fontFamily: ownerFonts.medium,
    },
    chartBar: {
      width: "100%",
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    chartDay: {
      fontSize: 10,
      color: colors.textDim,
      marginTop: 4,
      fontFamily: ownerFonts.regular,
    },
    trendBar: {
      backgroundColor: colors.primary,
      opacity: 0.85,
    },
    trendLegend: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 8,
      textAlign: "center",
      fontFamily: ownerFonts.medium,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
      gap: 8,
    },
    topName: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      fontFamily: ownerFonts.medium,
    },
    topCount: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.semiBold,
    },
    topTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    topFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    refRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
    },
    refLabel: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    refValue: {
      fontSize: 13,
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    emptyHint: {
      textAlign: "center",
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 8,
      fontFamily: ownerFonts.regular,
    },
  });
}
