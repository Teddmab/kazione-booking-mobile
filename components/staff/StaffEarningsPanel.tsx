import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
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
import { formatCurrency, localeForLanguage } from "@/lib/format";
import type { CommissionLedgerRow } from "@/services/staff/profile";

type Period = "current_month" | "last_month" | "all";
type StatusFilter = "all" | "unpaid";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function periodToRange(period: Period): { from?: string; to?: string } {
  const now = new Date();
  if (period === "current_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toIsoLocal(from), to: toIsoLocal(now) };
  }
  if (period === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toIsoLocal(start), to: toIsoLocal(end) };
  }
  return {};
}

function periodLabel(period: Period, language: string, allTimeLabel: string): string {
  const locale = localeForLanguage(language);
  const now = new Date();
  if (period === "current_month") {
    return now.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }
  if (period === "last_month") {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }
  return allTimeLabel;
}

function formatRowDate(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(localeForLanguage(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function LedgerRow({
  row,
  currency,
  language,
  styles,
  colors,
}: {
  row: CommissionLedgerRow;
  currency: string;
  language: string;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const { t } = useTranslation();
  const paid = Boolean(row.commission_paid_at);
  const amount = paid
    ? (row.commission_amount_paid ?? row.commission_amount)
    : row.commission_amount;

  return (
    <View style={styles.ledgerRow}>
      <Ionicons
        name={paid ? "checkmark-circle" : "time-outline"}
        size={18}
        color={paid ? colors.success : "#d97706"}
        style={{ marginTop: 2 }}
      />
      <View style={styles.ledgerBody}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {row.service_name}
        </Text>
        <Text style={styles.rowMeta}>
          {formatRowDate(row.starts_at, language)} · {row.client_name} ·{" "}
          {formatCurrency(row.price, currency, language)}{" "}
          {t("staffEarnings.appointment")}
        </Text>
        {paid && row.commission_paid_at ? (
          <Text style={styles.paidMeta}>
            {t("staffEarnings.paid")} {formatRowDate(row.commission_paid_at, language)}
            {row.commission_pay_method
              ? ` ${t("staffEarnings.via")} ${row.commission_pay_method.replace(/_/g, " ")}`
              : ""}
          </Text>
        ) : null}
      </View>
      <View style={styles.ledgerRight}>
        <Text
          style={[
            styles.commissionAmount,
            { color: paid ? colors.success : "#d97706" },
          ]}>
          {formatCurrency(amount, currency, language)}
        </Text>
        <View
          style={[
            styles.statusPill,
            paid ? styles.statusPillPaid : styles.statusPillPending,
          ]}>
          <Text
            style={[
              styles.statusPillText,
              { color: paid ? colors.success : "#d97706" },
            ]}>
            {paid ? t("staffEarnings.paid") : t("staffEarnings.pending")}
          </Text>
        </View>
      </View>
    </View>
  );
}

interface Props {
  /** Bump to trigger a refetch (e.g. parent pull-to-refresh). */
  refreshNonce?: number;
}

/** Commission summary + ledger — shared by Performance (Earnings tab) and /earnings. */
export function StaffEarningsPanel({ refreshNonce = 0 }: Props) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const settings = useBusinessSettings(businessId);
  const currency = settings.data?.settings?.currency_code ?? "EUR";

  const [period, setPeriod] = useState<Period>("current_month");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const range = useMemo(() => periodToRange(period), [period]);
  const { data, isLoading, isError, error, refetch } = useMyCommissions({
    from: range.from,
    to: range.to,
    status: statusFilter,
  });

  useEffect(() => {
    if (refreshNonce > 0) void refetch();
  }, [refreshNonce, refetch]);

  const summary = data?.summary;
  const rows = data?.commissions ?? [];
  const activePeriodLabel = periodLabel(
    period,
    i18n.language,
    t("staffEarnings.periodAll"),
  );

  const periods: Period[] = ["current_month", "last_month", "all"];

  return (
    <View style={styles.wrap}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHead}>
            <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
            <Text style={styles.summaryLabel}>{t("staffEarnings.totalEarned")}</Text>
          </View>
          <Text style={styles.summaryValue}>
            {isLoading
              ? "…"
              : formatCurrency(summary?.total_earned ?? 0, currency, i18n.language)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHead}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.summaryLabel}>{t("staffEarnings.totalPaid")}</Text>
          </View>
          <Text style={[styles.summaryValue, { color: colors.success }]}>
            {isLoading
              ? "…"
              : formatCurrency(summary?.total_paid ?? 0, currency, i18n.language)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHead}>
            <Ionicons name="time-outline" size={14} color="#d97706" />
            <Text style={styles.summaryLabel}>{t("staffEarnings.awaiting")}</Text>
          </View>
          <Text style={[styles.summaryValue, { color: "#d97706" }]}>
            {isLoading
              ? "…"
              : formatCurrency(summary?.total_unpaid ?? 0, currency, i18n.language)}
          </Text>
        </View>
      </View>

      <View style={styles.filters}>
        <View style={styles.chipRow}>
          {periods.map((p) => {
            const active = period === p;
            const label = periodLabel(p, i18n.language, t("staffEarnings.periodAll"));
            return (
              <Pressable
                key={p}
                style={[styles.periodChip, active && styles.periodChipActive]}
                onPress={() => setPeriod(p)}>
                <Text
                  style={[
                    styles.periodChipText,
                    active && styles.periodChipTextActive,
                  ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.chipRow}>
          {(["all", "unpaid"] as StatusFilter[]).map((s) => {
            const active = statusFilter === s;
            return (
              <Pressable
                key={s}
                style={[styles.statusChip, active && styles.statusChipActive]}
                onPress={() => setStatusFilter(s)}>
                <Text
                  style={[
                    styles.statusChipText,
                    active && styles.statusChipTextActive,
                  ]}>
                  {s === "all"
                    ? t("staffEarnings.filterAll")
                    : t("staffEarnings.filterUnpaid")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.listCard}>
        <Text style={styles.listTitle}>
          {t("staffEarnings.commissionsHeading", { period: activePeriodLabel })}
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
            <Ionicons name="cash-outline" size={40} color={colors.border} />
            <Text style={styles.emptyText}>{t("staffEarnings.empty")}</Text>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.appointment_id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <LedgerRow
                row={item}
                currency={currency}
                language={i18n.language}
                styles={styles}
                colors={colors}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { gap: 14 },
    summaryRow: { flexDirection: "row", gap: 8 },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      gap: 6,
    },
    summaryHead: { flexDirection: "row", alignItems: "center", gap: 4 },
    summaryLabel: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    filters: { gap: 8 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    periodChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: colors.card,
    },
    periodChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySurface,
    },
    periodChipText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
      textTransform: "capitalize",
    },
    periodChipTextActive: {
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    statusChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: colors.card,
    },
    statusChipActive: {
      borderColor: colors.text,
      backgroundColor: colors.text,
    },
    statusChipText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    statusChipTextActive: {
      color: colors.card,
      fontFamily: ownerFonts.semiBold,
    },
    listCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      overflow: "hidden",
    },
    listTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 10,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 14,
    },
    ledgerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    ledgerBody: { flex: 1, gap: 2, minWidth: 0 },
    serviceName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    rowMeta: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    paidMeta: {
      fontSize: 11,
      color: colors.textDim,
      fontFamily: ownerFonts.regular,
      marginTop: 2,
    },
    ledgerRight: { alignItems: "flex-end", gap: 4 },
    commissionAmount: {
      fontSize: 14,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
    },
    statusPill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    statusPillPaid: {
      borderColor: "#a7f3d0",
    },
    statusPillPending: {
      borderColor: "#fde68a",
    },
    statusPillText: {
      fontSize: 10,
      fontFamily: ownerFonts.medium,
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 48,
      paddingHorizontal: 24,
      gap: 10,
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
      marginTop: 4,
    },
  });
}
