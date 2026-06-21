import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { HorizontalBarChart } from "@/components/owner/analytics/HorizontalBarChart";
import { SectionHeader } from "@/components/owner/analytics/SectionHeader";
import { DashboardStatCard } from "@/components/owner/DashboardStatCard";
import { QueryState } from "@/components/owner/QueryState";
import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { AddSupplierSheet } from "@/components/owner/suppliers/AddSupplierSheet";
import { AddProductSheet } from "@/components/owner/suppliers/AddProductSheet";
import { CreateOrderSheet } from "@/components/owner/suppliers/CreateOrderSheet";
import { ProductCard } from "@/components/owner/suppliers/ProductCard";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useSupplierSpendFinance } from "@/hooks/useOwnerExpenses";
import {
  useSupplierOrders,
  useSuppliers,
} from "@/hooks/useOwnerSuppliers";
import { useOwnerProducts } from "@/hooks/useOwnerProducts";
import { dateRangeForPeriod } from "@/lib/financePeriod";
import { formatCurrency } from "@/lib/format";
import type { SupplierType, SupplierWithStats } from "@/types/suppliers";

type Tab = "overview" | "suppliers" | "purchases" | "inventory";

export default function OwnerSuppliersScreen() {
  const { t } = useTranslation();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [tab, setTab] = useState<Tab>("overview");
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [supplierPrefill, setSupplierPrefill] = useState<{ name: string; supplier_type: SupplierType } | undefined>();
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

  const range = useMemo(() => dateRangeForPeriod("month"), []);
  const suppliers = useSuppliers(businessId);
  const orders = useSupplierOrders(businessId);
  const spend = useSupplierSpendFinance(businessId, range);
  const productsQuery = useOwnerProducts(businessId);

  const supplierList = suppliers.data?.suppliers ?? [];
  const orderList = orders.data?.orders ?? [];
  const productList = productsQuery.data?.products ?? [];

  const totalSpend = supplierList.reduce((s, x) => s + x.total_spent, 0);
  const activeCount = supplierList.filter((s) => s.is_active).length;
  const openOrdersCount = supplierList.reduce((s, x) => s + x.open_orders, 0);
  const lowStockCount = productList.filter((p) => p.is_low_stock && p.is_active).length;

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
      { key: "inventory" as const, label: "Inventory" },
    ],
    [t],
  );

  const refresh = () => {
    void suppliers.refetch();
    void orders.refetch();
    void spend.refetch();
    void productsQuery.refetch();
  };

  return (
    <OwnerStackShell title={t("owner.suppliers")}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={suppliers.isRefetching || productsQuery.isRefetching} onRefresh={refresh} />
        }
      >
        <TabChipSelector value={tab} chips={tabs} onChange={setTab} />

        {/* ── Overview ── */}
        {tab === "overview" && (
          <QueryState loading={suppliers.isLoading} error={suppliers.isError ? (suppliers.error as Error) : null} onRetry={refresh}>
            <View style={styles.grid}>
              <DashboardStatCard label={t("owner.suppliersTotalSpend")} value={formatCurrency(totalSpend)} icon="wallet-outline" />
              <DashboardStatCard label={t("owner.suppliersActive")} value={String(activeCount)} icon="bus-outline" />
              <DashboardStatCard label="Open Orders" value={String(openOrdersCount)} icon="receipt-outline" />
              <DashboardStatCard label={t("owner.suppliersCount")} value={String(suppliers.data?.total ?? 0)} icon="people-outline" />
            </View>
            <SectionHeader title={t("owner.suppliersSpendByVendor")} />
            <HorizontalBarChart items={spendChart} emptyLabel={t("owner.financeNoData")} />
            <SectionHeader title={t("owner.suppliersRecentOrders")} />
            {orderList.slice(0, 5).map((o) => (
              <View key={o.id} style={styles.row}>
                <Text style={styles.rowTitle}>{o.supplier?.name ?? o.reference}</Text>
                <Text style={styles.rowMeta}>{formatCurrency(o.total_amount)} · {o.status}</Text>
              </View>
            ))}
          </QueryState>
        )}

        {/* ── Suppliers ── */}
        {tab === "suppliers" && (
          <>
            <Pressable style={styles.addBtn} onPress={() => setAddSupplierOpen(true)}>
              <Text style={styles.addBtnText}>+ {t("owner.suppliersAdd")}</Text>
            </Pressable>
            <FlatList
              data={supplierList}
              keyExtractor={(item: SupplierWithStats) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowMeta}>
                    {formatCurrency(item.total_spent)} · {item.open_orders} {t("owner.suppliersOpenOrders")}
                    {!item.is_active ? " · inactive" : ""}
                  </Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.empty}>{t("owner.financeNoData")}</Text>}
            />
          </>
        )}

        {/* ── Purchases ── */}
        {tab === "purchases" && (
          <>
            <Pressable style={styles.primaryBtn} onPress={() => setCreateOrderOpen(true)}>
              <Text style={styles.primaryBtnText}>+ New Purchase</Text>
            </Pressable>
            <SectionHeader title="Recent Orders" />
            {orderList.length === 0 && <Text style={styles.empty}>No purchases yet</Text>}
            {orderList.slice(0, 10).map((o) => (
              <View key={o.id} style={styles.row}>
                <Text style={styles.rowTitle}>
                  {o.supplier?.name ?? "Unknown"}{o.reference ? ` · ${o.reference}` : ""}
                </Text>
                <Text style={styles.rowMeta}>
                  {formatCurrency(o.total_amount)} · {o.status}
                  {o.items ? ` · ${o.items.length} item(s)` : ""}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* ── Inventory ── */}
        {tab === "inventory" && (
          <>
            {lowStockCount > 0 && (
              <View style={styles.lowStockBanner}>
                <Text style={styles.lowStockText}>
                  ⚠ {lowStockCount} product{lowStockCount > 1 ? "s" : ""} low on stock
                </Text>
              </View>
            )}
            <Pressable style={styles.addBtn} onPress={() => setAddProductOpen(true)}>
              <Text style={styles.addBtnText}>+ Add Product</Text>
            </Pressable>
            <QueryState loading={productsQuery.isLoading} error={productsQuery.isError ? (productsQuery.error as Error) : null} onRetry={() => void productsQuery.refetch()}>
              {productList.length === 0 ? (
                <Text style={styles.empty}>No products yet. Add your first product.</Text>
              ) : (
                productList.map((p) => (
                  <ProductCard key={p.id} product={p} onPress={() => {}} />
                ))
              )}
            </QueryState>
          </>
        )}
      </ScrollView>

      <AddSupplierSheet
        visible={addSupplierOpen}
        onClose={() => { setAddSupplierOpen(false); setSupplierPrefill(undefined); }}
        businessId={businessId}
        prefill={supplierPrefill}
      />
      <AddProductSheet visible={addProductOpen} onClose={() => setAddProductOpen(false)} businessId={businessId} />
      <CreateOrderSheet
        visible={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        businessId={businessId}
        onNewSupplierNeeded={(name, supplier_type) => {
          setCreateOrderOpen(false);
          setSupplierPrefill({ name, supplier_type });
          setAddSupplierOpen(true);
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
  rowTitle: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  rowMeta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
  addBtn: { alignSelf: "flex-start", marginTop: 12, marginBottom: 8 },
  addBtnText: { fontSize: 14, fontWeight: "600", color: ownerColors.primary },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  empty: { textAlign: "center", color: ownerColors.textMuted, marginTop: 24 },
  lowStockBanner: {
    backgroundColor: "#FFF3CD",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  lowStockText: { fontSize: 14, fontWeight: "600", color: "#664D03" },
});
