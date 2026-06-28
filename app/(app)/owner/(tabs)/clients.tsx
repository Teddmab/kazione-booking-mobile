import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";

import { AddClientSheet, type AddClientValues } from "@/components/owner/AddClientSheet";
import { AppointmentDetailSheet } from "@/components/owner/AppointmentDetailSheet";
import { ClientListToolbar } from "@/components/owner/ClientListToolbar";
import { CompactStatStrip } from "@/components/owner/CompactStatStrip";
import { ClientDetailSheet, type ClientEditValues } from "@/components/owner/ClientDetailSheet";
import { ImportClientsSheet } from "@/components/owner/ImportClientsSheet";
import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { QueryState } from "@/components/owner/QueryState";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import {
  useCreateOwnerClient,
  useImportOwnerClients,
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
import type { AppointmentWithRelations, ClientWithStats, ImportClientRow } from "@/types/owner";
import {
  useCancelOwnerAppointment,
  useUpdateOwnerAppointmentStatus,
} from "@/hooks/useOwnerAppointments";

type SortBy = "name" | "visits" | "last_visit" | "spent";

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

function sortClients(list: ClientWithStats[], sortBy: SortBy): ClientWithStats[] {
  return [...list].sort((a, b) => {
    if (sortBy === "name") {
      return `${a.first_name} ${a.last_name ?? ""}`.localeCompare(
        `${b.first_name} ${b.last_name ?? ""}`,
      );
    }
    if (sortBy === "visits") return b.appointment_count - a.appointment_count;
    if (sortBy === "last_visit") {
      if (!a.last_visit) return 1;
      if (!b.last_visit) return -1;
      return new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime();
    }
    if (sortBy === "spent") return b.total_spent - a.total_spent;
    return 0;
  });
}

export default function OwnerClientsScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const router = useRouter();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<ClientWithStats | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filter, setFilter] = useState<ClientStatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [apptSelected, setApptSelected] = useState<AppointmentWithRelations | null>(null);
  const [apptSheetOpen, setApptSheetOpen] = useState(false);

  useOwnerClientsRealtime(businessId);
  const createClient = useCreateOwnerClient(businessId);
  const updateClient = useUpdateOwnerClient(businessId);
  const importClients = useImportOwnerClients(businessId);
  const updateApptStatus = useUpdateOwnerAppointmentStatus(businessId);
  const cancelAppt = useCancelOwnerAppointment(businessId);

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
  const sorted = useMemo(() => sortClients(filtered, sortBy), [filtered, sortBy]);

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

  const sortChips = useMemo(
    () => [
      { key: "name" as const, label: "Nom" },
      { key: "visits" as const, label: "Visites" },
      { key: "last_visit" as const, label: "Dernière visite" },
      { key: "spent" as const, label: "Dépenses" },
    ],
    [],
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
          toast.success("Client créé", `${values.first_name} ${values.last_name} a été ajouté.`);
        },
        onError: (e) => toast.error("Erreur", e.message),
      },
    );
  };

  const onImportConfirm = (rows: ImportClientRow[]) => {
    importClients.mutate(rows, {
      onSuccess: (result) => {
        setImportOpen(false);
        toast.success(
          "Import terminé",
          `${result.imported} client(s) importé(s)${result.updated ? `, ${result.updated} mis à jour` : ""}.`,
        );
      },
      onError: (e) => toast.error("Erreur", e.message),
    });
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
          toast.success("Enregistré", "Client mis à jour.");
        },
        onError: (e) => toast.error("Erreur", e.message),
      },
    );
  };

  const onBookClient = (clientId: string, clientName: string) => {
    setSheetOpen(false);
    router.push({
      pathname: "/(app)/owner/walk-in",
      params: { clientId, clientName },
    } as Href);
  };

  return (
    <View style={styles.flex}>
      <OwnerAppBar
        title={t("owner.clients")}
        rightSlot={
          <View style={styles.headerActions}>
            <Pressable
              style={styles.importBtn}
              onPress={() => setImportOpen(true)}
              accessibilityLabel="Importer des clients">
              <Text style={styles.importBtnText}>Import</Text>
            </Pressable>
            <Pressable
              style={styles.addBtn}
              onPress={() => setAddOpen(true)}
              accessibilityLabel="Ajouter un client">
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>
        }
      />
      <CompactStatStrip
        items={[
          { label: t("owner.clientsTotal"), value: String(stats.total), icon: "people-outline" },
          { label: t("owner.clientFilterNew"), value: String(stats.new), icon: "person-add-outline" },
          { label: t("owner.clientFilterActive"), value: String(stats.active), icon: "heart-outline" },
          { label: "VIP", value: String(stats.vip), icon: "star-outline" },
        ]}
      />
      <ClientListToolbar
        searchOpen={searchOpen}
        search={search}
        onSearchChange={setSearch}
        onSearchOpen={() => setSearchOpen(true)}
        onSearchClose={() => setSearchOpen(false)}
        filter={filter}
        filterChips={filterChips}
        onFilterChange={setFilter}
        sortBy={sortBy}
        sortOptions={sortChips}
        onSortChange={setSortBy}
        searchPlaceholder={t("owner.clientsSearchPlaceholder")}
      />
      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && sorted.length === 0}
        emptyMessage={debounced ? t("owner.clientsEmptySearch") : t("owner.clientsEmpty")}
        onRetry={refreshAll}>
        <FlatList
          data={sorted}
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
        businessId={businessId}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={onSaveClient}
        onBook={onBookClient}
        onAppointmentPress={(appt) => {
          setSheetOpen(false);
          setApptSelected(appt);
          setApptSheetOpen(true);
        }}
        busy={updateClient.isPending}
      />
      <AppointmentDetailSheet
        appointment={apptSelected}
        businessId={businessId}
        visible={apptSheetOpen}
        onClose={() => setApptSheetOpen(false)}
        onConfirmStatus={(id, status) => {
          updateApptStatus.mutate(
            { id, status },
            {
              onSuccess: () => {
                setApptSheetOpen(false);
                refreshAll();
              },
              onError: (e) => toast.error("Erreur", e.message),
            },
          );
        }}
        onCancel={(id, reason) => {
          cancelAppt.mutate(
            { id, reason },
            {
              onSuccess: () => {
                setApptSheetOpen(false);
                refreshAll();
              },
              onError: (e) => toast.error("Erreur", e.message),
            },
          );
        }}
        onReschedule={(appt) => {
          setApptSheetOpen(false);
          router.push("/(app)/owner/(tabs)/appointments" as Href);
        }}
        busy={updateApptStatus.isPending || cancelAppt.isPending}
      />
      <AddClientSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={onAddClient}
        busy={createClient.isPending}
      />
      <ImportClientsSheet
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        onConfirm={onImportConfirm}
        busy={importClients.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  importBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
  },
  importBtnText: { fontSize: 13, fontWeight: "600", color: ownerColors.primary },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ownerColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { fontSize: 20, fontWeight: "700", color: ownerColors.primary, lineHeight: 22 },
  list: { padding: 16, paddingTop: 8 },
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
