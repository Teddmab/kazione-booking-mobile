import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { DashboardStatCard } from "@/components/owner/DashboardStatCard";
import { OwnerAddHeaderButton } from "@/components/owner/OwnerAddHeaderButton";
import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { QueryState } from "@/components/owner/QueryState";
import { ServiceAiPanel } from "@/components/owner/ServiceAiPanel";
import {
  ServiceFormSheet,
  type ServiceFormValues,
} from "@/components/owner/ServiceFormSheet";
import { ServiceRow } from "@/components/owner/ServiceRow";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import {
  useDeactivateOwnerService,
  useOwnerServices,
  useRestoreOwnerService,
  useSaveOwnerService,
} from "@/hooks/useOwnerServices";
import { extractCategoryNames, groupServicesByCategory } from "@/lib/groupServicesByCategory";
import { getServiceAnalysis, type ServiceInsight, type ServiceSuggestion } from "@/services/owner/ai";
import type { OwnerServiceRow } from "@/types/owner";

export default function OwnerServicesScreen() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useOwnerServices(businessId);
  const saveService = useSaveOwnerService(businessId);
  const deactivate = useDeactivateOwnerService(businessId);
  const restore = useRestoreOwnerService(businessId);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<OwnerServiceRow | null>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [aiSuggestions, setAiSuggestions] = useState<ServiceSuggestion[]>([]);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [dismissedNames, setDismissedNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: analysisData,
    isLoading: analysisLoading,
    isError: analysisError,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: ["ai-service-analysis", businessId],
    queryFn: () => getServiceAnalysis(businessId),
    enabled: analysisEnabled && !!businessId,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const openAdd = useCallback(() => {
    setEditing(null);
    setFormStep(1);
    setAiSuggestions([]);
    setSheetOpen(true);
  }, []);

  const services = data ?? [];
  const categories = useMemo(() => extractCategoryNames(services), [services]);

  const stats = useMemo(
    () => ({
      total: services.length,
      active: services.filter((s) => s.is_active).length,
      archived: services.filter((s) => !s.is_active).length,
      categories: new Set(
        services.map((s) => s.category_name?.trim() || "Sans catégorie"),
      ).size,
    }),
    [services],
  );

  const sections = useMemo(() => {
    const q = debouncedSearch;
    if (q) {
      const matched = services.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.category_name ?? "").toLowerCase().includes(q),
      );
      return [{ title: "Résultats", data: matched }];
    }

    const activeSections = groupServicesByCategory(services.filter((s) => s.is_active));
    const archived = services.filter((s) => !s.is_active);
    if (archived.length === 0) return activeSections;
    return [...activeSections, { title: "Archivés", data: archived }];
  }, [services, debouncedSearch]);

  const issueCount = useMemo(() => {
    return (analysisData?.analysis ?? []).filter(
      (item) =>
        item.severity !== "ok" &&
        !dismissedNames.has(item.service_name.toLowerCase()),
    ).length;
  }, [analysisData, dismissedNames]);

  const onSubmit = (
    values: ServiceFormValues,
    serviceId: string | null,
    localImageUri?: string | null,
  ) => {
    saveService.mutate(
      { values, serviceId, localImageUri },
      {
        onSuccess: () => {
          setSheetOpen(false);
          setEditing(null);
          setAiSuggestions([]);
          Alert.alert("Enregistré", serviceId ? "Service mis à jour." : "Service créé.");
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  const onArchive = (item: OwnerServiceRow) => {
    Alert.alert(
      `Archiver ${item.name} ?`,
      "Ce service ne sera plus réservable.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Archiver",
          style: "destructive",
          onPress: () => {
            deactivate.mutate(item.id, {
              onSuccess: () => Alert.alert("Archivé", "Le service a été archivé."),
              onError: (e) => Alert.alert("Erreur", e.message),
            });
          },
        },
      ],
    );
  };

  const onRestore = (item: OwnerServiceRow) => {
    restore.mutate(item.id, {
      onSuccess: () => Alert.alert("Restauré", "Le service est de nouveau actif."),
      onError: (e) => Alert.alert("Erreur", e.message),
    });
  };

  const onDeactivateFromSheet = (id: string) => {
    deactivate.mutate(id, {
      onSuccess: () => {
        setSheetOpen(false);
        setEditing(null);
        Alert.alert("Archivé", "Le service a été archivé.");
      },
      onError: (e) => Alert.alert("Erreur", e.message),
    });
  };

  const openEdit = (item: OwnerServiceRow) => {
    setEditing(item);
    setFormStep(1);
    setAiSuggestions([]);
    setSheetOpen(true);
  };

  const openFixFromAi = (insight: ServiceInsight) => {
    const match = services.find(
      (s) => s.name.toLowerCase() === insight.service_name.toLowerCase(),
    );
    if (!match) return;
    const suggestions = insight.suggestions ?? [];
    const hasOnlyPriceIssues =
      suggestions.length > 0 && suggestions.every((s) => s.field === "price");
    setEditing(match);
    setFormStep(hasOnlyPriceIssues ? 2 : 1);
    setAiSuggestions(suggestions);
    setAiPanelOpen(false);
    setSheetOpen(true);
  };

  const openAiPanel = () => {
    setAnalysisEnabled(true);
    setAiPanelOpen(true);
  };

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.kpiGrid}>
        <DashboardStatCard label="Total" value={String(stats.total)} icon="list-outline" />
        <DashboardStatCard label="Actifs" value={String(stats.active)} icon="checkmark-circle-outline" />
        <DashboardStatCard
          label="Archivés"
          value={String(stats.archived)}
          icon="archive-outline"
        />
        <DashboardStatCard
          label="Catégories"
          value={String(stats.categories)}
          icon="grid-outline"
        />
      </View>
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher un service…"
        placeholderTextColor={ownerColors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  return (
    <OwnerStackShell
      title="Services"
      rightSlot={<OwnerAddHeaderButton onPress={openAdd} />}>
      <View style={styles.flex}>
        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          empty={!isLoading && services.length === 0}
          emptyMessage="Aucun service. Appuyez sur + pour en ajouter."
          onRetry={() => void refetch()}>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled
            ListHeaderComponent={listHeader}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
            }
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeader}>{title}</Text>
            )}
            renderItem={({ item, section }) => (
              <ServiceRow
                item={item}
                onPress={() => openEdit(item)}
                onArchive={item.is_active ? () => onArchive(item) : undefined}
                onRestore={
                  !item.is_active && section.title === "Archivés"
                    ? () => onRestore(item)
                    : undefined
                }
              />
            )}
          />
        </QueryState>

        <Pressable style={styles.fab} onPress={openAiPanel} accessibilityLabel="Analyse IA">
          <Ionicons name="sparkles" size={24} color="#fff" />
          {issueCount > 0 ? (
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{issueCount > 9 ? "9+" : issueCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ServiceFormSheet
        visible={sheetOpen}
        service={editing}
        categorySuggestions={categories}
        defaultCurrency={services[0]?.currency_code ?? "EUR"}
        initialStep={formStep}
        aiSuggestions={aiSuggestions}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
          setAiSuggestions([]);
        }}
        onSubmit={onSubmit}
        onDeactivate={editing ? onDeactivateFromSheet : undefined}
        busy={saveService.isPending || deactivate.isPending}
      />

      <ServiceAiPanel
        visible={aiPanelOpen}
        loading={analysisLoading}
        error={analysisError}
        summary={analysisData?.summary}
        insights={analysisData?.analysis ?? []}
        dismissedNames={dismissedNames}
        onClose={() => setAiPanelOpen(false)}
        onRefresh={() => void refetchAnalysis()}
        onFix={openFixFromAi}
        onDismiss={(name) =>
          setDismissedNames((prev) => new Set([...prev, name.toLowerCase()]))
        }
      />
    </OwnerStackShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  header: { paddingTop: 16, paddingBottom: 8, gap: 12 },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  search: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: ownerColors.card,
    color: ownerColors.text,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: ownerColors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: ownerColors.bg,
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ownerColors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  fabBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
