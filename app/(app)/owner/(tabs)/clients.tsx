import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";

import { AddClientSheet, type AddClientValues } from "@/components/owner/AddClientSheet";
import { DashboardStatCard } from "@/components/owner/DashboardStatCard";
import { ClientDetailSheet, type ClientEditValues } from "@/components/owner/ClientDetailSheet";
import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { QueryState } from "@/components/owner/QueryState";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import {
  useCreateOwnerClient,
  useOwnerClients,
  useUpdateOwnerClient,
} from "@/hooks/useOwnerClients";
import { useOwnerClientsRealtime } from "@/hooks/useOwnerRealtime";
import { ownerClientStatsOrEmpty, useOwnerClientStats } from "@/hooks/useOwnerClientStats";
import {
  getClientStatus,
  matchesClientFilter,
  type ClientStatusFilter,
} from "@/lib/clientStatus";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import type { ClientWithStats } from "@/types/owner";

function ClientRow({ item, onPress }: { item: ClientWithStats; onPress: () => void }) {
  const { t } = useTranslation();
  const name = clientDisplayName(item.first_name, item.last_name);
  const status = getClientStatus(item.appointment_count, item.last_visit);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.nameRow}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.statusBadge}>{status}</Text>
      </View>
      {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
      {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
      <View style={styles.stats}>
        <Text style={styles.stat}>{t("owner.clientApptCount", { count: item.appointment_count })}</Text>
        <Text style={styles.stat}>{formatCurrency(item.total_spent)}</Text>
        {item.last_visit ? (
          <Text style={styles.stat}>{t("owner.clientLastVisit", { date: formatDate(item.last_visit) })}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function OwnerClientsScreen() {
  const { t } = useTranslation();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<ClientWithStats | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<ClientStatusFilter>("all");

  useOwnerClientsRealtime(businessId);
  const createClient = useCreateOwnerClient(businessId);
  const updateClient = useUpdateOwnerClient(businessId);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useOwnerClients(
    businessId,
    { search: debounced || undefined, limit: 100 },
  );

  const {
    data: statsData,
    refetch: refetchStats,
    isRefetching: isRefetchingStats,
  } = useOwnerClientStats(businessId);

  const stats = ownerClientStatsOrEmpty(statsData);

  useFocusEffect(
    useCallback(() => {
      if (!businessId) return;
      void refetch();
      void refetchStats();
    }, [businessId, refetch, refetchStats]),
  );

  const allClients = data?.clients ?? [];
  const filtered = allClients.filter((c) =>
    matchesClientFilter(getClientStatus(c.appointment_count, c.last_visit), filter),
  );

  const refreshAll = useCallback(() => {
    void refetch();
    void refetchStats();
  }, [refetch, refetchStats]);

  const filterChips = useMemo(
    () => [
      { key: "all" as const, label: t("owner.clientFilterAll") },
      { key: "vip" as const, label: "VIP" },
      { key: "active" as const, label: t("owner.clientFilterActive") },
      { key: "new" as const, label: t("owner.clientFilterNew") },
      { key: "at_risk" as const, label: t("owner.clientFilterAtRisk") },
      { key: "inactive" as const, label: t("owner.clientFilterInactive") },
    ],
    [t],
  );

  const onAddClient = (values: AddClientValues) => {
    createClient.mutate(
      {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email || null,
        phone: values.phone || null,
        notes: values.notes || null,
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          Alert.alert("Client créé", `${values.first_name} ${values.last_name} a été ajouté.`);
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  const onSaveClient = (id: string, values: ClientEditValues) => {
    updateClient.mutate(
      {
        clientId: id,
        data: {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email || null,
          phone: values.phone || null,
          notes: values.notes || null,
        },
      },
      {
        onSuccess: () => {
          setSheetOpen(false);
          Alert.alert("Enregistré", "Client mis à jour.");
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  return (
    <View style={styles.flex}>
      <OwnerAppBar
        title={t("owner.clients")}
        rightSlot={
          <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)} accessibilityLabel="Ajouter un client">
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        }
      />
      <View style={styles.kpiGrid}>
        <DashboardStatCard label={t("owner.clientsTotal")} value={String(stats.total)} icon="people-outline" />
        <DashboardStatCard label={t("owner.clientFilterNew")} value={String(stats.new)} icon="person-add-outline" />
        <DashboardStatCard label={t("owner.clientFilterActive")} value={String(stats.active)} icon="heart-outline" />
        <DashboardStatCard label="VIP" value={String(stats.vip)} icon="star-outline" />
      </View>
      <View style={styles.searchWrap}>
        <TextInput
          style={[ownerStyles.searchInput, styles.searchInput]}
          placeholder={t("owner.clientsSearchPlaceholder")}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {search.length > 0 ? (
          <Pressable style={styles.clearBtn} onPress={() => setSearch("")} accessibilityLabel={t("owner.clearSearch")}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.filterWrap}>
        <TabChipSelector value={filter} chips={filterChips} onChange={setFilter} />
      </View>
      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && filtered.length === 0}
        emptyMessage={debounced ? t("owner.clientsEmptySearch") : t("owner.clientsEmpty")}
        onRetry={refreshAll}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || isRefetchingStats}
              onRefresh={refreshAll}
            />
          }
          renderItem={({ item }) => (
            <ClientRow
              item={item}
              onPress={() => {
                setSelected(item);
                setSheetOpen(true);
              }}
            />
          )}
        />
      </QueryState>
      <ClientDetailSheet
        client={selected}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={onSaveClient}
        busy={updateClient.isPending}
      />
      <AddClientSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={onAddClient}
        busy={createClient.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ownerColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { fontSize: 20, fontWeight: "700", color: ownerColors.primary, lineHeight: 22 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 8, position: "relative" },
  filterWrap: { paddingHorizontal: 16, paddingTop: 4 },
  searchInput: { paddingRight: 40 },
  clearBtn: { position: "absolute", right: 24, top: 20, width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  clearText: { fontSize: 16, color: ownerColors.textMuted },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text, flex: 1 },
  statusBadge: { fontSize: 11, fontWeight: "700", color: ownerColors.primary, textTransform: "uppercase" },
  meta: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 },
  stat: { fontSize: 12, color: ownerColors.textDim },
});
