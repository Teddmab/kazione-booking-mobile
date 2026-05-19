import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";

import { QueryState } from "@/components/owner/QueryState";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerStaff } from "@/hooks/useOwnerStaff";
import type { StaffMember } from "@/types/owner";

function StaffRow({ item }: { item: StaffMember }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.display_name}</Text>
        <View style={[styles.badge, !item.is_active && styles.badgeOff]}>
          <Text style={styles.badgeText}>{item.is_active ? "Actif" : "Inactif"}</Text>
        </View>
      </View>
      <Text style={styles.role}>{item.role}</Text>
      {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
    </View>
  );
}

export default function OwnerStaffScreen() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useOwnerStaff(businessId);

  const staff = data ?? [];

  return (
    <View style={styles.flex}>
      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && staff.length === 0}
        emptyMessage="Aucun membre d'équipe."
        onRetry={() => void refetch()}>
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderItem={({ item }) => <StaffRow item={item} />}
          ListHeaderComponent={
            <Text style={styles.hint}>
              Invitations et plannings détaillés : utilisez la version web pour l'instant.
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
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text, flex: 1 },
  role: { fontSize: 14, color: ownerColors.primary, marginTop: 4, textTransform: "capitalize" },
  meta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
  },
  badgeOff: { backgroundColor: "#f5f5f5" },
  badgeText: { fontSize: 11, fontWeight: "600", color: ownerColors.textMuted },
});
