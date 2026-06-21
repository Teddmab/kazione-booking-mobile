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
import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { QueryState } from "@/components/owner/QueryState";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { AddProductSheet } from "@/components/owner/suppliers/AddProductSheet";
import { AddSupplierSheet } from "@/components/owner/suppliers/AddSupplierSheet";
import { CreateOrderSheet } from "@/components/owner/suppliers/CreateOrderSheet";
import { ProductCard } from "@/components/owner/suppliers/ProductCard";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useSupplierSpendFinance } from "@/hooks/useOwnerExpenses";
import { useProducts } from "@/hooks/useOwnerProducts";
import { useSupplierOrders, useSuppliers } from "@/hooks/useOwnerSuppliers";
import { dateRangeForPeriod } from "@/lib/financePeriod";
import { formatCurrency } from "@/lib/format";
import type { SupplierRow, SupplierWithStats } from "@/types/suppliers";

type Tab = "overview" | "suppliers" | "products" | "purchases";

function orderStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "ordered":
      return "Commandé";
    case "received":
      return "Reçu";
    case "cancelled":
      return "Annulé";
    default:
      return status;
  }
}

export default function OwnerSuppliersScreen() {
  const { t } = useTranslation();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<SupplierRow | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [prefillSupplierName, setPrefillSupplierName] = useState("");

  const range = useMemo(() => dateRangeForPeriod("month"), []);
  const suppliers = useSuppliers(businessId, { search: search.trim() || undefined });
  const orders = useSupplierOrders(businessId, { limit: 20 });
  const products = useProducts(businessId);
  const spend = useSupplierSpendFinance(businessId, range);

  const supplierList = suppliers.data?.suppliers ?? [];
  const productList = products.data?.products ?? [];
  const lowStockItems = productList.filter((p) => p.is_low_stock);
  const totalSpend = supplierList.reduce((s, x) => s + x.total_spent, 0);
  const activeCount = supplierList.filter((s) => s.is_active).length;
  const openOrdersCount = supplierList.reduce((s, x) => s + x.open_orders, 0);
  const avgOrder = openOrdersCount > 0 ? totalSpend / openOrdersCount : 0;

  const spendChart = (spend.data ?? []).map((row) => ({
    label: row.supplier_name,
    value: row.total,
    formatted: formatCurrency(row.total),
  }));

  const tabs = useMemo(
    () => [
      { key: "overview" as const, label: t("owner.suppliersTabOverview") },
      { key: "suppliers" as const, label: t("owner.suppliersTabList") },
      { key: "products" as const, label: t("owner.suppliersTabProducts") },
      { key: "purchases" as const, label: t("owner.suppliersTabPurchases") },
    ],
    [t],
  );

  const refreshing =
    suppliers.isRefetching || orders.isRefetching || products.isRefetching || spend.isRefetching;

  const refresh = () => {
    void suppliers.refetch();
    void orders.refetch();
    void products.refetch();
    void spend.refetch();
  };

  const openAddSupplier = (hint?: string) => {
    setEditSupplier(null);
    if (hint) setPrefillSupplierName(hint);
    setAddSupplierOpen(true);
  };

  const openEditSupplier = (supplier: SupplierWithStats) => {
    setEditSupplier(supplier);
    setAddSupplierOpen(true);
  };

  const closeSupplierSheet = () => {
    setAddSupplierOpen(false);
    setEditSupplier(null);
    setPrefillSupplierName("");
  };

  return (
    <OwnerStackShell title={t("owner.suppliers")}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        {lowStockItems.length > 0 ? (
          <Pressable style={styles.lowStockBanner} onPress={() => setTab("products")}>
            <Text style={styles.lowStockText}>
              {t("owner.suppliersLowStockBanner", { count: lowStockItems.length })}
            </Text>
          </Pressable>
        ) : null}

        <TabChipSelector value={tab} chips={tabs} onChange={setTab} />

        {tab === "overview" ? (
          <QueryState
            loading={suppliers.isLoading}
            error={suppliers.isError ? (suppliers.error as Error) : null}
            onRetry={refresh}>
            <View style={styles.grid}>
              <DashboardStatCard
                label={t("owner.suppliersTotalSpend")}
                value={formatCurrency(totalSpend)}
                icon="wallet-outline"
              />
              <DashboardStatCard
                label={t("owner.suppliersActive")}
                value={String(activeCount)}
                icon="bus-outline"
              />
              <DashboardStatCard
                label={t("owner.suppliersAvgOrder")}
                value={formatCurrency(avgOrder)}
                icon="receipt-outline"
              />
              <DashboardStatCard
                label={t("owner.suppliersCount")}
                value={String(suppliers.data?.total ?? 0)}
                icon="people-outline"
              />
            </View>
            <SectionHeader title={t("owner.suppliersSpendByVendor")} />
            <HorizontalBarChart items={spendChart} emptyLabel={t("owner.financeNoData")} />
            <SectionHeader title={t("owner.suppliersRecentOrders")} />
            {(orders.data?.orders ?? []).slice(0, 5).map((o) => (
              <View key={o.id} style={styles.row}>
                <Text style={styles.rowTitle}>{o.supplier?.name ?? o.reference}</Text>
                <Text style={styles.rowMeta}>
                  {formatCurrency(o.total_amount)} · {orderStatusLabel(o.status)}
                </Text>
              </View>
            ))}
            {(orders.data?.orders ?? []).length === 0 ? (
              <Text style={styles.empty}>{t("owner.financeNoData")}</Text>
            ) : null}
          </QueryState>
        ) : null}

        {tab === "suppliers" ? (
          <>
            <View style={styles.toolbar}>
              <TextInput
                style={[styles.input, styles.searchInput]}
                value={search}
                onChangeText={setSearch}
                placeholder={t("owner.suppliersSearchPlaceholder")}
              />
              <Pressable style={styles.addBtn} onPress={() => openAddSupplier()}>
                <Text style={styles.addBtnText}>+ {t("owner.suppliersAdd")}</Text>
              </Pressable>
            </View>
            <FlatList
              data={supplierList}
              keyExtractor={(item: SupplierWithStats) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable style={styles.row} onPress={() => openEditSupplier(item)}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    {!item.is_active ? (
                      <Text style={styles.inactiveBadge}>{t("owner.suppliersInactive")}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.rowMeta}>
                    {formatCurrency(item.total_spent)} · {item.open_orders}{" "}
                    {t("owner.suppliersOpenOrders")}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.empty}>{t("owner.financeNoData")}</Text>}
            />
          </>
        ) : null}

        {tab === "products" ? (
          <>
            {lowStockItems.length > 0 ? (
              <View style={styles.lowStockBannerInline}>
                <Text style={styles.lowStockText}>
                  {t("owner.suppliersLowStockBanner", { count: lowStockItems.length })}
                </Text>
              </View>
            ) : null}
            <Pressable style={styles.addBtn} onPress={() => setAddProductOpen(true)}>
              <Text style={styles.addBtnText}>+ {t("owner.suppliersAddProduct")}</Text>
            </Pressable>
            <QueryState
              loading={products.isLoading}
              error={products.isError ? (products.error as Error) : null}
              onRetry={refresh}>
              <FlatList
                data={productList}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => <ProductCard product={item} />}
                ListEmptyComponent={<Text style={styles.empty}>{t("owner.suppliersNoProducts")}</Text>}
              />
            </QueryState>
          </>
        ) : null}

        {tab === "purchases" ? (
          <>
            <Pressable style={ownerStyles.primaryBtn} onPress={() => setCreateOrderOpen(true)}>
              <Text style={ownerStyles.primaryBtnText}>{t("owner.suppliersNewPurchase")}</Text>
            </Pressable>
            <SectionHeader title={t("owner.suppliersRecentOrders")} />
            <QueryState
              loading={orders.isLoading}
              error={orders.isError ? (orders.error as Error) : null}
              onRetry={refresh}>
              {(orders.data?.orders ?? []).map((o) => (
                <View key={o.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{o.supplier?.name ?? o.reference}</Text>
                  <Text style={styles.rowMeta}>
                    {formatCurrency(o.total_amount)} · {orderStatusLabel(o.status)}
                  </Text>
                  {o.reference ? <Text style={styles.rowSub}>{o.reference}</Text> : null}
                </View>
              ))}
              {(orders.data?.orders ?? []).length === 0 ? (
                <Text style={styles.empty}>{t("owner.financeNoData")}</Text>
              ) : null}
            </QueryState>
          </>
        ) : null}
      </ScrollView>

      <AddSupplierSheet
        visible={addSupplierOpen}
        businessId={businessId}
        supplier={editSupplier}
        initialName={prefillSupplierName}
        onClose={closeSupplierSheet}
        onSaved={refresh}
      />

      <AddProductSheet
        visible={addProductOpen}
        businessId={businessId}
        onClose={() => setAddProductOpen(false)}
      />

      <CreateOrderSheet
        visible={createOrderOpen}
        businessId={businessId}
        onClose={() => setCreateOrderOpen(false)}
        onNeedNewSupplier={(hint) => {
          setCreateOrderOpen(false);
          openAddSupplier(hint);
        }}
      />
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
  rowHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: ownerColors.text, flex: 1 },
  rowMeta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
  rowSub: { fontSize: 12, color: ownerColors.textDim, marginTop: 2 },
  inactiveBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: ownerColors.textDim,
    backgroundColor: ownerColors.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  toolbar: { marginTop: 12, gap: 8 },
  addBtn: { alignSelf: "flex-start", marginTop: 12, marginBottom: 8 },
  addBtnText: { fontSize: 14, fontWeight: "600", color: ownerColors.primary },
  searchInput: { marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    backgroundColor: ownerColors.card,
    color: ownerColors.text,
  },
  empty: { textAlign: "center", color: ownerColors.textMuted, marginTop: 24 },
  lowStockBanner: {
    backgroundColor: "#FFF3CD",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFE69C",
  },
  lowStockBannerInline: {
    backgroundColor: "#FFF3CD",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#FFE69C",
  },
  lowStockText: { fontSize: 14, fontWeight: "600", color: "#664D03" },
});
