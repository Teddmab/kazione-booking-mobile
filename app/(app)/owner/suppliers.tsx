import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { HorizontalBarChart } from "@/components/owner/analytics/HorizontalBarChart";
import { SectionHeader } from "@/components/owner/analytics/SectionHeader";
import { DashboardStatCard } from "@/components/owner/DashboardStatCard";
import { QueryState } from "@/components/owner/QueryState";
import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useSupplierSpendFinance } from "@/hooks/useOwnerExpenses";
import {
  useCreateSupplier,
  useCreateSupplierOrder,
  useSupplierOrders,
  useSuppliers,
} from "@/hooks/useOwnerSuppliers";
import { dateRangeForPeriod } from "@/lib/financePeriod";
import { formatCurrency } from "@/lib/format";
import type { SupplierWithStats } from "@/types/suppliers";

type Tab = "overview" | "suppliers" | "purchases";

export default function OwnerSuppliersScreen() {
  const { t } = useTranslation();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [tab, setTab] = useState<Tab>("overview");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [orderSupplierId, setOrderSupplierId] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [orderRef, setOrderRef] = useState("");

  const range = useMemo(() => dateRangeForPeriod("month"), []);
  const suppliers = useSuppliers(businessId);
  const orders = useSupplierOrders(businessId);
  const spend = useSupplierSpendFinance(businessId, range);
  const createSupplier = useCreateSupplier(businessId);
  const createOrder = useCreateSupplierOrder(businessId);

  const supplierList = suppliers.data?.suppliers ?? [];
  const totalSpend = supplierList.reduce((s, x) => s + x.total_spent, 0);
  const activeCount = supplierList.filter((s) => s.is_active).length;
  const avgOrder =
    supplierList.length > 0 ? totalSpend / Math.max(supplierList.reduce((s, x) => s + x.open_orders, 0), 1) : 0;

  const spendChart = (spend.data ?? []).map((row) => ({
    label: row.supplier_name,
    value: row.total,
    formatted: formatCurrency(row.total),
  }));

  const tabs = useMemo(
    () => [
      { key: "overview" as const, label: t("owner.suppliersTabOverview") },
      { key: "suppliers" as const, label: t("owner.suppliersTabList") },
      { key: "purchases" as const, label: t("owner.suppliersTabPurchases") },
    ],
    [t],
  );

  const refresh = () => {
    void suppliers.refetch();
    void orders.refetch();
    void spend.refetch();
  };

  const submitSupplier = () => {
    const name = newName.trim();
    if (!name) return;
    createSupplier.mutate({ name }, { onSuccess: () => { setNewName(""); setAddOpen(false); } });
  };

  const submitOrder = () => {
    const amount = parseFloat(orderAmount);
    if (!orderSupplierId || Number.isNaN(amount)) return;
    createOrder.mutate(
      { supplier_id: orderSupplierId, total_amount: amount, reference: orderRef.trim() || undefined },
      {
        onSuccess: () => {
          setOrderAmount("");
          setOrderRef("");
        },
      },
    );
  };

  return (
    <OwnerStackShell title={t("owner.suppliers")}>
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={suppliers.isRefetching} onRefresh={refresh} />
      }>
      <TabChipSelector value={tab} chips={tabs} onChange={setTab} />

      {tab === "overview" ? (
        <QueryState loading={suppliers.isLoading} error={suppliers.isError ? (suppliers.error as Error) : null} onRetry={refresh}>
          <View style={styles.grid}>
            <DashboardStatCard label={t("owner.suppliersTotalSpend")} value={formatCurrency(totalSpend)} icon="wallet-outline" />
            <DashboardStatCard label={t("owner.suppliersActive")} value={String(activeCount)} icon="bus-outline" />
            <DashboardStatCard label={t("owner.suppliersAvgOrder")} value={formatCurrency(avgOrder)} icon="receipt-outline" />
            <DashboardStatCard label={t("owner.suppliersCount")} value={String(suppliers.data?.total ?? 0)} icon="people-outline" />
          </View>
          <SectionHeader title={t("owner.suppliersSpendByVendor")} />
          <HorizontalBarChart items={spendChart} emptyLabel={t("owner.financeNoData")} />
          <SectionHeader title={t("owner.suppliersRecentOrders")} />
          {(orders.data?.orders ?? []).slice(0, 5).map((o) => (
            <View key={o.id} style={styles.row}>
              <Text style={styles.rowTitle}>{o.supplier?.name ?? o.reference}</Text>
              <Text style={styles.rowMeta}>{formatCurrency(o.total_amount)} · {o.status}</Text>
            </View>
          ))}
        </QueryState>
      ) : null}

      {tab === "suppliers" ? (
        <>
          <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <Text style={styles.addBtnText}>+ {t("owner.suppliersAdd")}</Text>
          </Pressable>
          {addOpen ? (
            <View style={styles.formCard}>
              <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder={t("owner.suppliersNamePlaceholder")} />
              <Pressable style={ownerStyles.primaryBtn} onPress={submitSupplier}>
                <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
              </Pressable>
            </View>
          ) : null}
          <FlatList
            data={supplierList}
            keyExtractor={(item: SupplierWithStats) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {formatCurrency(item.total_spent)} · {item.open_orders} {t("owner.suppliersOpenOrders")}
                </Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>{t("owner.financeNoData")}</Text>}
          />
        </>
      ) : null}

      {tab === "purchases" ? (
        <View style={styles.formCard}>
          <Text style={styles.label}>{t("owner.suppliersSelectVendor")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {supplierList.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.vendorChip, orderSupplierId === s.id && styles.vendorChipActive]}
                onPress={() => setOrderSupplierId(s.id)}>
                <Text style={[styles.vendorChipText, orderSupplierId === s.id && styles.vendorChipTextActive]}>{s.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <TextInput style={styles.input} value={orderRef} onChangeText={setOrderRef} placeholder={t("owner.suppliersOrderRef")} />
          <TextInput style={styles.input} value={orderAmount} onChangeText={setOrderAmount} keyboardType="decimal-pad" placeholder={t("owner.suppliersOrderAmount")} />
          <Pressable style={ownerStyles.primaryBtn} onPress={submitOrder}>
            <Text style={ownerStyles.primaryBtnText}>{t("owner.suppliersRecordPurchase")}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
    </OwnerStackShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 12 },
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
  addBtn: { alignSelf: "flex-start", marginTop: 12, marginBottom: 8 },
  addBtnText: { fontSize: 14, fontWeight: "600", color: ownerColors.primary },
  formCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.bg,
  },
  label: { fontSize: 12, color: ownerColors.textDim },
  chipScroll: { marginVertical: 4 },
  vendorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ownerColors.border,
    marginRight: 8,
  },
  vendorChipActive: { borderColor: ownerColors.primary, backgroundColor: ownerColors.primaryMuted },
  vendorChipText: { fontSize: 13, color: ownerColors.textMuted },
  vendorChipTextActive: { color: ownerColors.primary, fontWeight: "600" },
  empty: { textAlign: "center", color: ownerColors.textMuted, marginTop: 24 },
});
