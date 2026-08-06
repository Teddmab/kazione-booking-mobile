import { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { QueryState } from "@/components/owner/QueryState";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { StaffClientDetailSheet } from "@/components/staff/StaffClientDetailSheet";
import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useStaffClients } from "@/hooks/useStaffClients";
import { formatCurrency } from "@/lib/format";
import {
  formatRelativeVisit,
  getStaffClientStatus,
  type StaffClientStatus,
} from "@/lib/staffClientStatus";
import type { ClientWithStats } from "@/types/owner";

type FilterKey = "All" | StaffClientStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "All", label: "Tous" },
  { key: "Frequent", label: "Fréquents" },
  { key: "Returning", label: "Récurrents" },
  { key: "New", label: "Nouveaux" },
];

const STATUS_LABELS: Record<StaffClientStatus, string> = {
  Frequent: "Fréquent",
  Returning: "Récurrent",
  New: "Nouveau",
};

const STATUS_COLORS: Record<
  StaffClientStatus,
  { bg: string; text: string; border: string }
> = {
  Frequent: {
    bg: ownerColors.primarySurface,
    text: ownerColors.primary,
    border: ownerColors.primary + "44",
  },
  Returning: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
  New: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
};

function ClientRow({
  item,
  currency,
  onPress,
}: {
  item: ClientWithStats & { status: StaffClientStatus };
  currency: string;
  onPress: () => void;
}) {
  const colors = STATUS_COLORS[item.status];
  const name = `${item.first_name} ${item.last_name}`.trim();
  const initials = `${item.first_name[0] ?? ""}${item.last_name[0] ?? ""}`
    .toUpperCase()
    .slice(0, 2);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials || "?"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name || "Client"}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.bg, borderColor: colors.border },
            ]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {item.appointment_count} visite
          {item.appointment_count === 1 ? "" : "s"} ·{" "}
          {formatRelativeVisit(item.last_visit)} ·{" "}
          {formatCurrency(item.total_spent, currency)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function StaffClientsScreen() {
  const { tenant } = useTenantContext();
  const settings = useBusinessSettings(tenant?.businessId ?? "");
  const currency = settings.data?.settings?.currency_code ?? "EUR";

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("All");
  const [selected, setSelected] = useState<ClientWithStats | null>(null);

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useStaffClients(search);

  const tagged = useMemo(
    () =>
      (data?.clients ?? []).map((c) => ({
        ...c,
        status: getStaffClientStatus(c.appointment_count),
      })),
    [data?.clients],
  );

  const filtered = useMemo(
    () =>
      filter === "All" ? tagged : tagged.filter((c) => c.status === filter),
    [tagged, filter],
  );

  const frequent = tagged.filter((c) => c.status === "Frequent").length;
  const returning = tagged.filter((c) => c.status === "Returning").length;
  const neu = tagged.filter((c) => c.status === "New").length;

  return (
    <View style={ownerStyles.screen}>
      <StaffAppBar
        title="Clients"
        subtitle="Préférences, notes et historique"
        displayTitle
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={ownerColors.primary}
          />
        }>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data?.total ?? tagged.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{neu}</Text>
            <Text style={styles.statLabel}>Nouveaux</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{returning}</Text>
            <Text style={styles.statLabel}>Récurrents</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{frequent}</Text>
            <Text style={styles.statLabel}>Fréquents</Text>
          </View>
        </View>

        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un client…"
          placeholderTextColor={ownerColors.textDim}
          autoCapitalize="none"
        />

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(f.key)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          empty={!isLoading && filtered.length === 0}
          emptyMessage="Aucun client dans cette vue."
          onRetry={() => void refetch()}>
          {filtered.map((c) => (
            <ClientRow
              key={c.id}
              item={c}
              currency={currency}
              onPress={() => setSelected(c)}
            />
          ))}
        </QueryState>
      </ScrollView>

      <StaffClientDetailSheet
        client={selected}
        visible={!!selected}
        currency={currency}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: ownerColors.primarySurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: ownerColors.primary,
    fontFamily: ownerFonts.bold,
  },
  statLabel: {
    fontSize: 10,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.medium,
  },
  search: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.card,
    marginBottom: 10,
    fontFamily: ownerFonts.regular,
  },
  chips: { gap: 8, paddingBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: ownerColors.card,
  },
  chipActive: {
    borderColor: ownerColors.primary,
    backgroundColor: ownerColors.primarySurface,
  },
  chipText: {
    fontSize: 13,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  chipTextActive: {
    color: ownerColors.primary,
    fontWeight: "600",
  },
  row: {
    ...ownerStyles.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ownerColors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: ownerColors.primary,
    fontFamily: ownerFonts.bold,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: "600", fontFamily: ownerFonts.semiBold },
  meta: {
    fontSize: 12,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.regular,
  },
});
