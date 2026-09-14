import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useMyCommissions } from "@/hooks/useStaffSelf";
import { zonedDateKey } from "@/lib/businessTime";
import { formatCurrency, formatTime, localeForLanguage } from "@/lib/format";
import type { CommissionLedgerRow } from "@/services/staff/profile";

type Period = "week" | "month";

const LIST_PREVIEW = 5;

const AVATAR_COLORS = [
  "#C4B5FD",
  "#93C5FD",
  "#86EFAC",
  "#FCD34D",
  "#FDA4AF",
  "#A5B4FC",
  "#67E8F9",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function periodToRange(period: Period): { from: string; to: string } {
  const now = new Date();
  if (period === "week") {
    const from = startOfWeekMonday(now);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return { from: toIsoLocal(from), to: toIsoLocal(to) };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toIsoLocal(from), to: toIsoLocal(now) };
}

function formatRangeLabel(
  from: string,
  to: string,
  language: string,
): string {
  const locale = localeForLanguage(language);
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  const sameMonth =
    a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    return `${a.getDate()} – ${b.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }
  return `${a.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  })} – ${b.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * 17) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function estimatedNextPayoutDate(language: string): string {
  const now = new Date();
  // Salon payouts typically land near month-end — surface the 26th of this
  // or next month as a soft estimate (matches design intent, not a hard promise).
  const target = new Date(now.getFullYear(), now.getMonth(), 26);
  if (now.getDate() > 26) {
    target.setMonth(target.getMonth() + 1);
  }
  return target.toLocaleDateString(localeForLanguage(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function weekdayShort(locale: string, mondayBasedIndex: number): string {
  // 0 = Monday … 6 = Sunday
  const date = new Date(2024, 0, 1 + mondayBasedIndex); // Mon Jan 1 2024
  return date.toLocaleDateString(locale, { weekday: "short" }).replace(/\.$/, "");
}

function buildWeeklyTrend(
  rows: CommissionLedgerRow[],
  language: string,
  timezone: string,
): { label: string; amount: number }[] {
  const locale = localeForLanguage(language);
  const amounts = Array(7).fill(0) as number[];
  for (const row of rows) {
    const key = zonedDateKey(row.starts_at, timezone);
    const d = new Date(`${key}T12:00:00`);
    const jsDay = d.getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    const amount = row.commission_paid_at
      ? (row.commission_amount_paid ?? row.commission_amount)
      : row.commission_amount;
    amounts[idx] += amount;
  }
  return amounts.map((amount, i) => ({
    label: weekdayShort(locale, i),
    amount,
  }));
}

function formatDayWhen(
  iso: string,
  language: string,
  timezone: string,
): string {
  const locale = localeForLanguage(language);
  const d = new Date(iso);
  const datePart = d.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    timeZone: timezone,
  });
  const timePart = formatTime(iso, language, timezone);
  return `${datePart} · ${timePart}`;
}

interface Props {
  refreshNonce?: number;
  onOpenPerformance?: () => void;
  onOpenPayoutDetail?: () => void;
}

export function StaffEarningsPanel({
  refreshNonce = 0,
  onOpenPerformance,
  onOpenPayoutDetail,
}: Props) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const timezone = tenant?.timezone ?? "Europe/Tallinn";
  const settings = useBusinessSettings(businessId);
  const currency = settings.data?.settings?.currency_code ?? "EUR";

  const [period, setPeriod] = useState<Period>("week");
  const [expanded, setExpanded] = useState(false);

  const range = useMemo(() => periodToRange(period), [period]);
  const { data, isLoading, isError, error, refetch } = useMyCommissions({
    from: range.from,
    to: range.to,
    status: "all",
  });

  useEffect(() => {
    if (refreshNonce > 0) void refetch();
  }, [refreshNonce, refetch]);

  useEffect(() => {
    setExpanded(false);
  }, [period]);

  const summary = data?.summary;
  const rows = data?.commissions ?? [];
  const pending = summary?.total_unpaid ?? 0;
  const confirmed = summary?.total_paid ?? 0;
  // Hero focuses on unpaid when present (maquette); otherwise show period total.
  const heroAmount = pending > 0 ? pending : (summary?.total_earned ?? 0);
  const heroPending = pending > 0;
  const revenue = useMemo(
    () => rows.reduce((sum, r) => sum + (r.price ?? 0), 0),
    [rows],
  );

  const trend = useMemo(
    () => buildWeeklyTrend(rows, i18n.language, timezone),
    [rows, i18n.language, timezone],
  );
  const trendMax = Math.max(...trend.map((d) => d.amount), 1);
  const gridSteps = [0, 0.33, 0.66, 1].map((f) => Math.round(trendMax * f));

  const visibleRows = expanded ? rows : rows.slice(0, LIST_PREVIEW);
  const hasMore = rows.length > LIST_PREVIEW;

  function showInfo(title: string, body: string) {
    Alert.alert(title, body);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.periodSeg}>
        {(["week", "month"] as Period[]).map((key) => {
          const active = period === key;
          return (
            <Pressable
              key={key}
              style={[styles.periodBtn, active && styles.periodBtnActive]}
              onPress={() => setPeriod(key)}>
              <Text
                style={[
                  styles.periodBtnText,
                  active && styles.periodBtnTextActive,
                ]}>
                {key === "week"
                  ? t("staffEarnings.periodWeek")
                  : t("staffEarnings.periodMonth")}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Estimated commission — maquette layout */}
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="wallet" size={18} color="#fff" />
          </View>
          <View style={styles.heroMain}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>
                {t("staffEarnings.estimatedCommission")}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() =>
                  showInfo(
                    t("staffEarnings.estimatedCommission"),
                    t("staffEarnings.estimatedCommissionHint"),
                  )
                }>
                <Ionicons
                  name="information-circle-outline"
                  size={15}
                  color={colors.textDim}
                />
              </Pressable>
            </View>
            <Text style={styles.heroAmount}>
              {isLoading
                ? "…"
                : formatCurrency(heroAmount, currency, i18n.language)}
            </Text>
            <View
              style={[
                styles.statusPill,
                heroPending ? styles.pendingPill : styles.confirmedPill,
              ]}>
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: heroPending ? colors.primary : colors.textMuted,
                  },
                ]}>
                {heroPending
                  ? t("staffEarnings.pending")
                  : t("staffEarnings.confirmed")}
              </Text>
            </View>
            <Text style={styles.heroHint}>
              {t("staffEarnings.estimatedCommissionBody")}
            </Text>
          </View>
          <View style={styles.heroBreakdown}>
            <View style={styles.breakdownRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.breakdownAmount}>
                  {formatCurrency(pending, currency, i18n.language)}
                </Text>
                <Text style={styles.breakdownLabel}>
                  {t("staffEarnings.pending")}
                </Text>
              </View>
            </View>
            <View style={styles.breakdownRow}>
              <View style={[styles.dot, { backgroundColor: colors.textDim }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.breakdownAmountMuted}>
                  {formatCurrency(confirmed, currency, i18n.language)}
                </Text>
                <Text style={styles.breakdownLabel}>
                  {t("staffEarnings.confirmed")}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Generated revenue — secondary, compact */}
      <View style={styles.revenueCard}>
        <View style={[styles.iconCircleSm, { backgroundColor: "#DBEAFE" }]}>
          <Ionicons name="trending-up" size={14} color="#2563EB" />
        </View>
        <View style={styles.revenueBody}>
          <View style={styles.titleRow}>
            <Text style={styles.revenueTitle}>
              {t("staffEarnings.generatedRevenue")}
            </Text>
            <Pressable
              hitSlop={8}
              onPress={() =>
                showInfo(
                  t("staffEarnings.generatedRevenue"),
                  t("staffEarnings.generatedRevenueBody"),
                )
              }>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={colors.textDim}
              />
            </Pressable>
          </View>
          <Text style={styles.revenueHint} numberOfLines={2}>
            {t("staffEarnings.generatedRevenueBody")}
          </Text>
        </View>
        <Text style={styles.revenueAmount}>
          {isLoading
            ? "…"
            : formatCurrency(revenue, currency, i18n.language)}
        </Text>
      </View>

      {/* Weekly trend — no card frame */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>
          {period === "week"
            ? t("staffEarnings.weeklyTrend")
            : t("staffEarnings.periodTrend")}
        </Text>
        <Text style={styles.sectionRange}>
          {formatRangeLabel(range.from, range.to, i18n.language)}
        </Text>
        <View style={styles.chartArea}>
          <View style={styles.yAxis}>
            {[...gridSteps].reverse().map((v, i) => (
              <Text key={`${v}-${i}`} style={styles.yLabel}>
                {Math.round(v)}€
              </Text>
            ))}
          </View>
          <View style={styles.chartPlot}>
            {gridSteps.map((v, i) => (
              <View
                key={`g-${v}-${i}`}
                style={[
                  styles.gridLine,
                  { bottom: `${(v / Math.max(trendMax, 1)) * 100}%` },
                ]}
              />
            ))}
            <View style={styles.barsRow}>
              {trend.map((day) => {
                const h = Math.max(
                  (day.amount / trendMax) * 100,
                  day.amount > 0 ? 6 : 0,
                );
                return (
                  <View key={day.label} style={styles.barCol}>
                    <Text style={styles.barValue}>
                      {day.amount > 0 ? `${Math.round(day.amount)}€` : ""}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${h}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barDay}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>
            {t("staffEarnings.estimatedCommission")}
          </Text>
        </View>
      </View>

      {/* Appointment detail — no card frame, airy rows */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>
          {t("staffEarnings.detailByAppointment")}
        </Text>

        {isError ? (
          <Pressable style={styles.emptyWrap} onPress={() => void refetch()}>
            <Text style={styles.emptyText}>
              {(error as Error)?.message ?? t("staffEarnings.empty")}
            </Text>
            <Text style={styles.retryText}>
              {t("common.retry", { defaultValue: "Retry" })}
            </Text>
          </Pressable>
        ) : isLoading && !data ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>…</Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="wallet-outline" size={36} color={colors.border} />
            <Text style={styles.emptyText}>{t("staffEarnings.empty")}</Text>
          </View>
        ) : (
          <>
            {visibleRows.map((row) => {
              const paid = Boolean(row.commission_paid_at);
              const amount = paid
                ? (row.commission_amount_paid ?? row.commission_amount)
                : row.commission_amount;
              return (
                <View key={row.appointment_id} style={styles.detailRow}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: avatarColor(row.client_name) },
                    ]}>
                    <Text style={styles.avatarText}>
                      {initials(row.client_name)}
                    </Text>
                  </View>
                  <View style={styles.detailBody}>
                    <Text style={styles.clientName} numberOfLines={1}>
                      {row.client_name}
                    </Text>
                    <Text style={styles.clientWhen} numberOfLines={1}>
                      {formatDayWhen(row.starts_at, i18n.language, timezone)}
                    </Text>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {row.service_name}
                    </Text>
                  </View>
                  <View style={styles.detailMoney}>
                    <Text style={styles.moneyLabel}>
                      {t("staffEarnings.colRevenue")}
                    </Text>
                    <Text style={styles.moneyValue}>
                      {formatCurrency(row.price, currency, i18n.language)}
                    </Text>
                    <Text style={[styles.moneyLabel, { marginTop: 6 }]}>
                      {t("staffEarnings.colCommission")}
                    </Text>
                    <Text style={styles.commAmount}>
                      {formatCurrency(amount, currency, i18n.language)}
                    </Text>
                    <View
                      style={[
                        styles.rowBadge,
                        paid ? styles.confirmedPill : styles.pendingPill,
                      ]}>
                      <Text
                        style={[
                          styles.rowBadgeText,
                          {
                            color: paid ? colors.textMuted : colors.primary,
                          },
                        ]}>
                        {paid
                          ? t("staffEarnings.confirmed")
                          : t("staffEarnings.pending")}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {hasMore ? (
              <Pressable
                style={styles.moreLink}
                onPress={() => setExpanded((v) => !v)}>
                <Text style={styles.moreLinkText}>
                  {expanded
                    ? t("staffEarnings.showLess")
                    : t("staffEarnings.showMore")}
                </Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      {/* Next payout */}
      {pending > 0 ? (
        <View style={styles.payoutCard}>
          <View style={styles.payoutIcon}>
            <Ionicons name="calendar" size={18} color="#C2410C" />
          </View>
          <View style={styles.payoutBody}>
            <Text style={styles.payoutLabel}>
              {t("staffEarnings.nextPayout")}
            </Text>
            <Text style={styles.payoutDate}>
              {estimatedNextPayoutDate(i18n.language)}
            </Text>
            <Text style={styles.payoutHint}>
              {t("staffEarnings.nextPayoutHint")}
            </Text>
          </View>
          {onOpenPayoutDetail ? (
            <Pressable style={styles.payoutBtn} onPress={onOpenPayoutDetail}>
              <Text style={styles.payoutBtnText}>
                {t("staffEarnings.viewDetail")}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {onOpenPerformance ? (
        <Pressable style={styles.perfLink} onPress={onOpenPerformance}>
          <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
          <Text style={styles.perfLinkText}>
            {t("staffEarnings.openPerformance")}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { gap: 12 },
    periodSeg: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 3,
      gap: 3,
    },
    periodBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 7,
      borderRadius: 8,
    },
    periodBtnActive: {
      backgroundColor: colors.primary,
    },
    periodBtnText: {
      fontSize: 13,
      fontFamily: ownerFonts.semiBold,
      color: colors.text,
    },
    periodBtnTextActive: {
      color: "#fff",
    },
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    heroRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    iconCircleSm: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    heroMain: { flex: 1, minWidth: 0 },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 2,
    },
    cardTitle: {
      fontSize: 14,
      fontFamily: ownerFonts.semiBold,
      color: colors.text,
    },
    heroAmount: {
      fontSize: 30,
      lineHeight: 36,
      fontFamily: ownerFonts.bold,
      color: colors.primary,
      marginTop: 2,
      marginBottom: 8,
    },
    statusPill: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginBottom: 8,
    },
    pendingPill: {
      backgroundColor: colors.primarySurface,
    },
    confirmedPill: {
      backgroundColor: colors.bg,
    },
    statusPillText: {
      fontSize: 12,
      fontFamily: ownerFonts.medium,
    },
    heroHint: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    heroBreakdown: {
      width: 96,
      gap: 12,
      paddingTop: 2,
    },
    breakdownRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 4,
    },
    breakdownAmount: {
      fontSize: 13,
      fontFamily: ownerFonts.semiBold,
      color: colors.text,
    },
    breakdownAmountMuted: {
      fontSize: 13,
      fontFamily: ownerFonts.semiBold,
      color: colors.textMuted,
    },
    breakdownLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
      marginTop: 1,
    },
    revenueCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    revenueBody: { flex: 1, minWidth: 0 },
    revenueTitle: {
      fontSize: 12,
      fontFamily: ownerFonts.semiBold,
      color: colors.text,
    },
    revenueHint: {
      fontSize: 10,
      lineHeight: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
      marginTop: 2,
    },
    revenueAmount: {
      fontSize: 15,
      fontFamily: ownerFonts.semiBold,
      color: "#2563EB",
    },
    sectionBlock: {
      paddingTop: 4,
      gap: 0,
    },
    sectionTitle: {
      fontSize: 15,
      fontFamily: ownerFonts.bold,
      color: colors.text,
    },
    sectionRange: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
      marginTop: 2,
      marginBottom: 12,
    },
    chartArea: {
      flexDirection: "row",
      gap: 6,
      height: 140,
    },
    yAxis: {
      width: 32,
      justifyContent: "space-between",
      paddingBottom: 18,
    },
    yLabel: {
      fontSize: 10,
      color: colors.textDim,
      fontFamily: ownerFonts.regular,
      textAlign: "right",
    },
    chartPlot: {
      flex: 1,
      position: "relative",
      paddingBottom: 18,
    },
    gridLine: {
      position: "absolute",
      left: 0,
      right: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderStyle: "dashed",
      borderColor: colors.border,
    },
    barsRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 4,
    },
    barCol: {
      flex: 1,
      alignItems: "center",
      height: "100%",
      justifyContent: "flex-end",
    },
    barValue: {
      fontSize: 9,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
      marginBottom: 2,
      height: 12,
    },
    barTrack: {
      flex: 1,
      width: "70%",
      maxWidth: 28,
      justifyContent: "flex-end",
    },
    barFill: {
      width: "100%",
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      minHeight: 0,
    },
    barDay: {
      position: "absolute",
      bottom: -16,
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    legendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 14,
    },
    legendText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 12,
      fontFamily: ownerFonts.semiBold,
      color: colors.text,
    },
    detailBody: { flex: 1, minWidth: 0, gap: 3 },
    clientName: {
      fontSize: 14,
      fontFamily: ownerFonts.semiBold,
      color: colors.text,
    },
    clientWhen: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    serviceName: {
      fontSize: 13,
      color: colors.text,
      fontFamily: ownerFonts.regular,
      marginTop: 2,
    },
    detailMoney: {
      alignItems: "flex-end",
      minWidth: 88,
    },
    moneyLabel: {
      fontSize: 10,
      color: colors.textDim,
      fontFamily: ownerFonts.medium,
      textTransform: "uppercase",
    },
    moneyValue: {
      fontSize: 13,
      fontFamily: ownerFonts.medium,
      color: colors.text,
      marginTop: 1,
    },
    commAmount: {
      fontSize: 14,
      fontFamily: ownerFonts.bold,
      color: colors.text,
      marginTop: 1,
    },
    rowBadge: {
      marginTop: 6,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    rowBadgeText: {
      fontSize: 10,
      fontFamily: ownerFonts.medium,
    },
    moreLink: {
      alignItems: "center",
      paddingTop: 16,
      paddingBottom: 4,
    },
    moreLinkText: {
      fontSize: 13,
      fontFamily: ownerFonts.semiBold,
      color: colors.primary,
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
      gap: 8,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
      fontFamily: ownerFonts.regular,
    },
    retryText: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    payoutCard: {
      backgroundColor: "#FFF7ED",
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: "#FFEDD5",
    },
    payoutIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: "#FFEDD5",
      alignItems: "center",
      justifyContent: "center",
    },
    payoutBody: { flex: 1, minWidth: 0 },
    payoutLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    payoutDate: {
      fontSize: 16,
      fontFamily: ownerFonts.bold,
      color: colors.text,
      marginTop: 2,
    },
    payoutHint: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
      marginTop: 2,
    },
    payoutBtn: {
      backgroundColor: "#EA580C",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    payoutBtnText: {
      color: "#fff",
      fontSize: 12,
      fontFamily: ownerFonts.semiBold,
    },
    perfLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    perfLinkText: {
      flex: 1,
      fontSize: 13,
      fontFamily: ownerFonts.medium,
      color: colors.text,
    },
  });
}
