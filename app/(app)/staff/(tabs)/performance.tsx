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
import {
  periodRange,
  useMyPerformance,
  type PeriodKey,
} from "@/hooks/useMyPerformance";
import { useStaffAppointments } from "@/hooks/useStaffAppointments";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import type { StaffAppointment } from "@/services/staff/appointments";
import type { StaffPerformance } from "@/services/staff/profile";

type ScreenTab = "overview" | "earnings";

const PERIOD_LABEL_KEYS: Record<PeriodKey, string> = {
  "7d": "staffPerf.periodWeek",
  "30d": "staffPerf.periodMonth",
  "90d": "staffPerf.periodCustom",
};

function weekdayShort(locale: string, dayIndex: number): string {
  const date = new Date(2024, 0, 7 + dayIndex);
  return date.toLocaleDateString(locale, { weekday: "short" });
}

function completionPct(rate: number | undefined | null): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function buildWeeklyActivity(appts: StaffAppointment[], locale: string) {
  const counts = Array(7).fill(0) as number[];
  for (const a of appts) {
    if (a.status === "cancelled") continue;
    const dow = new Date(a.starts_at).getUTCDay();
    counts[dow] += 1;
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

/** Same grouping as web StaffReportsPage periodTrend (W1…W5 by day-of-month). */
function buildPeriodTrend(appts: StaffAppointment[]) {
  const weekMap: Record<
    string,
    { week: string; completed: number; cancelled: number; total: number }
  > = {};
  for (const a of appts) {
    const d = new Date(a.starts_at);
    const weekNum = Math.ceil(d.getUTCDate() / 7);
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
  perf,
  loading,
  styles,
}: {
  perf: StaffPerformance | null | undefined;
  loading: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { t } = useTranslation();
  const cells = [
    {
      label: t("staffPerf.statAppts"),
      value: loading ? "…" : perf ? String(perf.bookings) : "—",
    },
    {
      label: t("staffPerf.statClients"),
      value: loading ? "…" : perf ? String(perf.unique_clients) : "—",
    },
    {
      label: t("staffPerf.statCompletion"),
      value: loading ? "…" : completionPct(perf?.completion_rate),
    },
    {
      label: t("staffPerf.statRating"),
      value: loading
        ? "…"
        : perf && perf.avg_rating > 0
          ? `${perf.avg_rating.toFixed(1)} ★`
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
  const { data: self } = useStaffSelf();

  const initialTab: ScreenTab =
    params.tab === "earnings" ? "earnings" : "overview";
  const [tab, setTab] = useState<ScreenTab>(initialTab);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [earningsRefreshNonce, setEarningsRefreshNonce] = useState(0);

  useEffect(() => {
    setTab(params.tab === "earnings" ? "earnings" : "overview");
  }, [params.tab]);

  const {
    data: perf,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMyPerformance(period);

  const { from, to } = periodRange(period);
  const {
    data: appointments = [],
    refetch: refetchAppts,
    isRefetching: apptsRefetching,
  } = useStaffAppointments(from, to, 500);

  const weeklyActivity = useMemo(
    () => buildWeeklyActivity(appointments, i18n.language),
    [appointments, i18n.language],
  );
  const topServices = useMemo(
    () => buildTopServices(appointments),
    [appointments],
  );
  const periodTrend = useMemo(
    () => buildPeriodTrend(appointments),
    [appointments],
  );

  function selectTab(next: ScreenTab) {
    setTab(next);
    router.replace(
      (next === "earnings"
        ? "/(app)/staff/(tabs)/performance?tab=earnings"
        : "/(app)/staff/(tabs)/performance") as Href,
    );
  }

  async function onRefresh() {
    if (tab === "earnings") {
      setEarningsRefreshNonce((n) => n + 1);
      return;
    }
    await Promise.all([refetch(), refetchAppts()]);
  }

  return (
    <View style={styles.screen}>
      <StaffAppBar
        title={t("staffPerf.title")}
        subtitle={perf?.display_name ?? self?.display_name ?? undefined}
        displayTitle
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={
              tab === "overview" && (isRefetching || apptsRefetching)
            }
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
          />
        }>
        <View style={styles.tabRow}>
          {(["overview", "earnings"] as ScreenTab[]).map((key) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                style={[styles.tabChip, active && styles.tabChipActive]}
                onPress={() => selectTab(key)}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {key === "overview"
                    ? t("staffPerf.tabOverview")
                    : t("staffEarnings.title")}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "earnings" ? (
          <StaffEarningsPanel refreshNonce={earningsRefreshNonce} />
        ) : (
          <>
            <PeriodSelector value={period} onChange={setPeriod} styles={styles} />

            <QueryState
              loading={false}
              error={isError ? (error as Error) : null}
              empty={false}
              onRetry={() => void refetch()}>
              <StatsRow perf={perf} loading={isLoading} styles={styles} />

              {isLoading && !perf ? (
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

              {!perf && !isLoading ? (
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
    tabRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
    tabChip: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: colors.card,
    },
    tabChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySurface,
    },
    tabText: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    tabTextActive: {
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    periodRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
    periodChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
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
    },
    topName: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      marginRight: 8,
      fontFamily: ownerFonts.medium,
    },
    topCount: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    topTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.bg,
      overflow: "hidden",
    },
    topFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    emptyHint: {
      fontSize: 13,
      color: colors.textDim,
      textAlign: "center",
      marginTop: 8,
      fontFamily: ownerFonts.regular,
    },
  });
}
