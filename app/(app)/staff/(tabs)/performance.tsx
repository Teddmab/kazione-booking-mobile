import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { QueryState } from "@/components/owner/QueryState";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import {
  periodRange,
  useMyPerformance,
  type PeriodKey,
} from "@/hooks/useMyPerformance";
import { useStaffAppointments } from "@/hooks/useStaffAppointments";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import { buildStaffReferralLink } from "@/lib/referralLink";
import type { StaffAppointment } from "@/services/staff/appointments";
import type { StaffPerformance } from "@/services/staff/profile";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "90d", label: "90 jours" },
];

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function completionPct(rate: number | undefined | null): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function buildWeeklyActivity(appts: StaffAppointment[]) {
  const counts = Array(7).fill(0) as number[];
  for (const a of appts) {
    if (a.status === "cancelled") continue;
    const dow = new Date(a.starts_at).getDay();
    counts[dow] += 1;
  }
  return DAY_NAMES.map((name, i) => ({ name, count: counts[i] }));
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

function PeriodSelector({
  value,
  onChange,
}: {
  value: PeriodKey;
  onChange: (p: PeriodKey) => void;
}) {
  return (
    <View style={styles.periodRow}>
      {PERIODS.map(({ key, label }) => {
        const active = value === key;
        return (
          <Pressable
            key={key}
            style={[styles.periodChip, active && styles.periodChipActive]}
            onPress={() => onChange(key)}>
            <Text
              style={[styles.periodText, active && styles.periodTextActive]}>
              {label}
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
}: {
  perf: StaffPerformance | null | undefined;
  loading: boolean;
}) {
  const cells = [
    {
      label: "RDV",
      value: loading ? "…" : perf ? String(perf.bookings) : "—",
    },
    {
      label: "Clients",
      value: loading ? "…" : perf ? String(perf.unique_clients) : "—",
    },
    {
      label: "Complétion",
      value: loading ? "…" : completionPct(perf?.completion_rate),
    },
    {
      label: "Note",
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
}: {
  data: { name: string; count: number }[];
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
}: {
  data: { name: string; count: number }[];
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

export default function StaffPerformanceScreen() {
  const toast = useToast();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data: self } = useStaffSelf();
  const settings = useBusinessSettings(businessId);
  const currency = settings.data?.settings?.currency_code ?? "EUR";

  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [copied, setCopied] = useState(false);

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
    () => buildWeeklyActivity(appointments),
    [appointments],
  );
  const topServices = useMemo(
    () => buildTopServices(appointments),
    [appointments],
  );

  const periodLabel =
    PERIODS.find((p) => p.key === period)?.label ?? "30 jours";

  const avgPerAppt =
    perf && perf.bookings > 0 ? perf.revenue / perf.bookings : null;

  const referralUrl = useMemo(() => {
    const slug = tenant?.slug;
    const staffProfileId =
      self?.staff_profile_id ?? tenant?.staffProfileId ?? null;
    if (!slug || !staffProfileId) return null;
    return buildStaffReferralLink(slug, staffProfileId);
  }, [tenant?.slug, tenant?.staffProfileId, self?.staff_profile_id]);

  async function copyReferral() {
    if (!referralUrl) {
      toast.warning("Lien", "Lien de parrainage indisponible.");
      return;
    }
    try {
      await Clipboard.setStringAsync(referralUrl);
      setCopied(true);
      toast.success("Copié", "Lien de parrainage copié.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(
        "Copie",
        err instanceof Error ? err.message : "Impossible de copier",
      );
    }
  }

  async function onRefresh() {
    await Promise.all([refetch(), refetchAppts()]);
  }

  return (
    <View style={ownerStyles.screen}>
      <StaffAppBar
        title="Performance"
        subtitle={perf?.display_name ?? self?.display_name ?? undefined}
        displayTitle
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || apptsRefetching}
            onRefresh={() => void onRefresh()}
            tintColor={ownerColors.primary}
          />
        }>
        <PeriodSelector value={period} onChange={setPeriod} />

        <QueryState
          loading={false}
          error={isError ? (error as Error) : null}
          empty={false}
          onRetry={() => void refetch()}>
          <StatsRow perf={perf} loading={isLoading} />

          {isLoading && !perf ? (
            <ActivityIndicator
              style={{ marginVertical: 16 }}
              color={ownerColors.primary}
            />
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mes parrainages</Text>
            <View style={styles.refStats}>
              <View style={styles.refStat}>
                <Text style={styles.refValue}>
                  {perf ? String(perf.referrals_initiated) : "—"}
                </Text>
                <Text style={styles.refLabel}>Envoyés</Text>
              </View>
              <View style={styles.refStat}>
                <Text style={styles.refValue}>
                  {perf ? String(perf.referral_conversions) : "—"}
                </Text>
                <Text style={styles.refLabel}>Convertis</Text>
              </View>
            </View>
            <Text style={styles.refRevenue}>
              CA parrainages :{" "}
              {perf ? money(perf.referral_revenue, currency) : "—"}
            </Text>
            <Pressable
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
              onPress={() => void copyReferral()}>
              <Text style={styles.copyText}>
                {copied ? "Copié !" : "Copier mon lien de parrainage"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gains — {periodLabel}</Text>
            <View style={styles.earnRow}>
              <Text style={styles.earnLabel}>CA généré</Text>
              <Text style={styles.earnValue}>
                {perf ? money(perf.revenue, currency) : "—"}
              </Text>
            </View>
            <View style={styles.earnRow}>
              <Text style={styles.earnLabel}>Commission</Text>
              <Text style={styles.earnValuePrimary}>
                {perf ? money(perf.commission_amount, currency) : "—"}
              </Text>
            </View>
            <View style={styles.earnRow}>
              <Text style={styles.earnLabel}>Taux de complétion</Text>
              <Text style={styles.earnValue}>
                {completionPct(perf?.completion_rate)}
              </Text>
            </View>
            <View style={[styles.earnRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.earnLabel}>Moy. / RDV</Text>
              <Text style={styles.earnValue}>
                {avgPerAppt != null ? money(avgPerAppt, currency) : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activité hebdomadaire</Text>
            <Text style={styles.cardHint}>
              RDV non annulés sur la période sélectionnée
            </Text>
            <WeeklyActivityChart data={weeklyActivity} />
          </View>

          {topServices.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Top services</Text>
              <TopServicesList data={topServices} />
            </View>
          ) : null}

          {!perf && !isLoading ? (
            <Text style={styles.emptyHint}>
              Aucune donnée pour cette période. Complétez un rendez-vous pour
              voir vos stats.
            </Text>
          ) : null}
        </QueryState>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  periodRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  periodChip: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: ownerColors.card,
  },
  periodChipActive: {
    borderColor: ownerColors.primary,
    backgroundColor: ownerColors.primary,
  },
  periodText: {
    fontSize: 13,
    color: ownerColors.textMuted,
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
    backgroundColor: ownerColors.primarySurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: ownerColors.primary,
    fontFamily: ownerFonts.bold,
  },
  statLabel: {
    fontSize: 10,
    color: ownerColors.textMuted,
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
    color: ownerColors.text,
    marginBottom: 10,
    fontFamily: ownerFonts.bold,
  },
  cardHint: {
    fontSize: 12,
    color: ownerColors.textDim,
    marginBottom: 10,
    fontFamily: ownerFonts.regular,
  },
  refStats: { flexDirection: "row", gap: 16, marginBottom: 8 },
  refStat: { flex: 1, alignItems: "center" },
  refValue: {
    fontSize: 22,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  refLabel: {
    fontSize: 12,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  refRevenue: {
    fontSize: 13,
    color: ownerColors.text,
    marginBottom: 12,
    textAlign: "center",
    fontFamily: ownerFonts.regular,
  },
  copyBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: ownerColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  copyBtnDone: { backgroundColor: "#059669" },
  copyText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: ownerFonts.semiBold,
  },
  earnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ownerColors.border,
  },
  earnLabel: {
    fontSize: 13,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.regular,
  },
  earnValue: {
    fontSize: 14,
    fontWeight: "600",
    color: ownerColors.text,
    fontFamily: ownerFonts.semiBold,
  },
  earnValuePrimary: {
    fontSize: 14,
    fontWeight: "700",
    color: ownerColors.primary,
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
    color: ownerColors.text,
    marginBottom: 2,
    fontFamily: ownerFonts.medium,
  },
  chartBar: {
    width: "100%",
    backgroundColor: ownerColors.primary,
    borderRadius: 3,
  },
  chartDay: {
    fontSize: 10,
    color: ownerColors.textDim,
    marginTop: 4,
    fontFamily: ownerFonts.regular,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  topName: {
    flex: 1,
    fontSize: 13,
    color: ownerColors.text,
    marginRight: 8,
    fontFamily: ownerFonts.medium,
  },
  topCount: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.text,
    fontFamily: ownerFonts.semiBold,
  },
  topTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ownerColors.bg,
    overflow: "hidden",
  },
  topFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: ownerColors.primary,
  },
  emptyHint: {
    fontSize: 13,
    color: ownerColors.textDim,
    textAlign: "center",
    marginTop: 8,
    fontFamily: ownerFonts.regular,
  },
});
