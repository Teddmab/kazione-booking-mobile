import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";

import { QueryState } from "@/components/owner/QueryState";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerServices } from "@/hooks/useOwnerServices";
import { formatCurrency } from "@/lib/format";
import type { OwnerServiceRow } from "@/types/owner";

function ServiceRow({ item }: { item: OwnerServiceRow }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={[styles.badge, !item.is_active && styles.badgeOff]}>
          <Text style={styles.badgeText}>{item.is_active ? "Actif" : "Inactif"}</Text>
        </View>
      </View>
      {item.category_name ? (
        <Text style={styles.category}>{item.category_name}</Text>
      ) : null}
      <Text style={styles.meta}>
        {item.duration_minutes} min · {formatCurrency(item.price, item.currency_code)}
      </Text>
      {item.description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
    </View>
  );
}

export default function OwnerServicesScreen() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useOwnerServices(businessId);

  const services = data ?? [];

  return (
    <View style={styles.flex}>
      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && services.length === 0}
        emptyMessage="Aucun service configuré."
        onRetry={() => void refetch()}>
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderItem={({ item }) => <ServiceRow item={item} />}
          ListHeaderComponent={
            <Text style={styles.hint}>
              Création et édition avancées des services : version web pour l'instant.
            </Text>
          }
        />
      </QueryState>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  list: { padding: 16 },
  hint: {
    fontSize: 13,
    color: ownerColors.textMuted,
    marginBottom: 16,
    lineHeight: 20,
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
  category: { fontSize: 13, color: ownerColors.primary, marginTop: 4 },
  meta: { fontSize: 14, color: ownerColors.textMuted, marginTop: 6 },
  desc: { fontSize: 13, color: ownerColors.textDim, marginTop: 8, lineHeight: 18 },
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
