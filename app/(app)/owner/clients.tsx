import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
} from "react-native";

import { QueryState } from "@/components/owner/QueryState";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerClients } from "@/hooks/useOwnerClients";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import type { ClientWithStats } from "@/types/owner";

function ClientRow({ item }: { item: ClientWithStats }) {
  const name = clientDisplayName(item.first_name, item.last_name);
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
      {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
      <View style={styles.stats}>
        <Text style={styles.stat}>{item.appointment_count} RDV</Text>
        <Text style={styles.stat}>{formatCurrency(item.total_spent)}</Text>
        {item.last_visit ? (
          <Text style={styles.stat}>Dernière visite {formatDate(item.last_visit)}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function OwnerClientsScreen() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useOwnerClients(
    businessId,
    { search: debounced || undefined, limit: 50 },
  );

  const clients = data?.clients ?? [];

  return (
    <View style={styles.flex}>
      <View style={styles.searchWrap}>
        <TextInput
          style={ownerStyles.searchInput}
          placeholder="Rechercher un client…"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setDebounced(search.trim())}
          returnKeyType="search"
          autoCapitalize="none"
        />
      </View>
      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && clients.length === 0}
        emptyMessage="Aucun client trouvé."
        onRetry={() => void refetch()}>
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderItem={({ item }) => <ClientRow item={item} />}
        />
      </QueryState>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  meta: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 },
  stat: { fontSize: 12, color: ownerColors.textDim },
});
