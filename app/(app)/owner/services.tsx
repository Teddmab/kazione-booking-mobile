import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { OwnerAddHeaderButton } from "@/components/owner/OwnerAddHeaderButton";
import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { QueryState } from "@/components/owner/QueryState";
import {
  ServiceFormSheet,
  type ServiceFormValues,
} from "@/components/owner/ServiceFormSheet";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import {
  useDeactivateOwnerService,
  useOwnerServices,
  useSaveOwnerService,
} from "@/hooks/useOwnerServices";
import { extractCategoryNames, groupServicesByCategory } from "@/lib/groupServicesByCategory";
import { formatCurrency } from "@/lib/format";
import type { OwnerServiceRow } from "@/types/owner";

function ServiceRow({
  item,
  onPress,
  onLongPress,
}: {
  item: OwnerServiceRow;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={[styles.badge, !item.is_active && styles.badgeOff]}>
          <Text style={styles.badgeText}>{item.is_active ? "Actif" : "Inactif"}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {item.duration_minutes} min · {formatCurrency(item.price, item.currency_code)}
      </Text>
      {item.description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <Text style={styles.hintLongPress}>Appui long → désactiver</Text>
    </Pressable>
  );
}

export default function OwnerServicesScreen() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useOwnerServices(businessId);
  const saveService = useSaveOwnerService(businessId);
  const deactivate = useDeactivateOwnerService(businessId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<OwnerServiceRow | null>(null);

  const openAdd = useCallback(() => {
    setEditing(null);
    setSheetOpen(true);
  }, []);

  const services = data ?? [];
  const sections = useMemo(() => groupServicesByCategory(services), [services]);
  const categories = useMemo(() => extractCategoryNames(services), [services]);

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
          Alert.alert("Enregistré", serviceId ? "Service mis à jour." : "Service créé.");
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  const onDeactivate = (id: string) => {
    deactivate.mutate(id, {
      onSuccess: () => {
        setSheetOpen(false);
        setEditing(null);
        Alert.alert("Désactivé", "Le service n'est plus actif.");
      },
      onError: (e) => Alert.alert("Erreur", e.message),
    });
  };

  const confirmDeactivate = (item: OwnerServiceRow) => {
    Alert.alert(
      "Désactiver",
      `Désactiver « ${item.name} » ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Désactiver",
          style: "destructive",
          onPress: () => onDeactivate(item.id),
        },
      ],
    );
  };

  return (
    <OwnerStackShell
      title="Services"
      rightSlot={<OwnerAddHeaderButton onPress={openAdd} />}>
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
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <ServiceRow
              item={item}
              onPress={() => {
                setEditing(item);
                setSheetOpen(true);
              }}
              onLongPress={() => confirmDeactivate(item)}
            />
          )}
        />
      </QueryState>

      <ServiceFormSheet
        visible={sheetOpen}
        service={editing}
        categorySuggestions={categories}
        defaultCurrency={services[0]?.currency_code ?? "EUR"}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
        onDeactivate={editing ? onDeactivate : undefined}
        busy={saveService.isPending || deactivate.isPending}
      />
    </OwnerStackShell>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 24 },
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
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text, flex: 1 },
  meta: { fontSize: 14, color: ownerColors.textMuted, marginTop: 6 },
  desc: { fontSize: 13, color: ownerColors.textDim, marginTop: 8, lineHeight: 18 },
  hintLongPress: { fontSize: 11, color: ownerColors.textDim, marginTop: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
    marginLeft: 8,
  },
  badgeOff: { backgroundColor: "#f5f5f5" },
  badgeText: { fontSize: 11, fontWeight: "600", color: ownerColors.textMuted },
});
