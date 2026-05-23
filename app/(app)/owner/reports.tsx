import { useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ExportReportSheet } from "@/components/owner/ExportReportSheet";
import { PeriodChipSelector } from "@/components/owner/PeriodChipSelector";
import { QueryState } from "@/components/owner/QueryState";
import { TransactionRow } from "@/components/owner/TransactionRow";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useTransactions } from "@/hooks/useOwnerFinance";
import { dateRangeForPeriod } from "@/lib/financePeriod";
import type { FinancePeriodKey, TransactionStatusFilter } from "@/types/finance";

const STATUS_FILTERS: TransactionStatusFilter[] = [
  "all",
  "completed",
  "cancelled",
  "refunded",
];

export default function OwnerReportsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  const [period, setPeriod] = useState<FinancePeriodKey>("month");
  const [status, setStatus] = useState<TransactionStatusFilter>("all");
  const [exportOpen, setExportOpen] = useState(false);

  const dateRange = useMemo(() => dateRangeForPeriod(period), [period]);
  const tx = useTransactions(businessId, status, dateRange);

  const appointments = useMemo(
    () => tx.data?.pages.flatMap((p) => p.appointments) ?? [],
    [tx.data],
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

  const periodChips = useMemo(
    () => [
      { key: "today" as const, label: t("owner.financePeriodToday") },
      { key: "week" as const, label: t("owner.financePeriodWeek") },
      { key: "month" as const, label: t("owner.financePeriodMonth") },
    ],
    [t],
  );

  return (
    <View style={styles.flex}>
      <View style={styles.filters}>
        <PeriodChipSelector value={period} chips={periodChips} onChange={setPeriod} />
        <View style={styles.statusRow}>
          {STATUS_FILTERS.map((s) => (
            <Pressable
              key={s}
              style={[styles.statusChip, status === s && styles.statusChipActive]}
              onPress={() => setStatus(s)}>
              <Text style={[styles.statusText, status === s && styles.statusTextActive]}>
                {t(`owner.txStatus_${s}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <QueryState
        loading={tx.isLoading}
        error={tx.isError ? (tx.error as Error) : null}
        onRetry={() => void tx.refetch()}>
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionRow item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={tx.isRefetching} onRefresh={() => void tx.refetch()} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>{t("owner.financeNoTransactions")}</Text>
          }
          ListFooterComponent={
            tx.hasNextPage ? (
              <Pressable
                style={styles.loadMore}
                onPress={() => void tx.fetchNextPage()}
                disabled={tx.isFetchingNextPage}>
                <Text style={styles.loadMoreText}>
                  {tx.isFetchingNextPage ? t("common.loading") : t("owner.loadMore")}
                </Text>
              </Pressable>
            ) : null
          }
        />
      </QueryState>

      <ExportReportSheet
        visible={exportOpen}
        businessId={businessId}
        onClose={() => setExportOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
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
});
