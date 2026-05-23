import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";

import { ClientDetailSheet } from "@/components/owner/ClientDetailSheet";
import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { QueryState } from "@/components/owner/QueryState";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerClients } from "@/hooks/useOwnerClients";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import type { ClientWithStats } from "@/types/owner";

function ClientRow({
  item,
  onPress,
}: {
  item: ClientWithStats;
  onPress: () => void;
}) {
  const name = clientDisplayName(item.first_name, item.last_name);
  return (
    <Pressable style={styles.card} onPress={onPress}>
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

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useOwnerClients(
    businessId,
    { search: debounced || undefined, limit: 50 },
  );

  const clients = data?.clients ?? [];

  return (
    <View style={styles.flex}>
      <OwnerAppBar title={t("owner.clients")} />
      <View style={styles.searchWrap}>
        <TextInput
          style={[ownerStyles.searchInput, styles.searchInput]}
          placeholder="Rechercher nom, email ou téléphone…"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {search.length > 0 ? (
          <Pressable
            style={styles.clearBtn}
            onPress={() => setSearch("")}
            accessibilityLabel="Effacer la recherche">
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && clients.length === 0}
        emptyMessage={debounced ? "Aucun client pour cette recherche." : "Aucun client."}
        onRetry={() => void refetch()}>
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, position: "relative" },
  searchInput: { paddingRight: 40 },
  clearBtn: {
    position: "absolute",
    right: 24,
    top: 24,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
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
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  meta: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 },
  stat: { fontSize: 12, color: ownerColors.textDim },
});
