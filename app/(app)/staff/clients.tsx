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
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
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

function getStatusColors(colors: ThemeColors): Record<
  StaffClientStatus,
  { bg: string; text: string; border: string }
> {
  return {
    Frequent: {
      bg: colors.primarySurface,
      text: colors.primary,
      border: colors.primary + "44",
    },
    Returning: {
      bg: colors.successMuted,
      text: colors.success,
      border: colors.success + "44",
    },
    New: {
      bg: colors.warningMuted,
      text: colors.warning,
      border: colors.warning + "44",
    },
  };
}

type ClientRowStyles = ReturnType<typeof makeStyles>;

function ClientRow({
  item,
  currency,
  onPress,
  styles,
  statusColors,
}: {
  item: ClientWithStats & { status: StaffClientStatus };
  currency: string;
  onPress: () => void;
  styles: ClientRowStyles;
  statusColors: ReturnType<typeof getStatusColors>;
}) {
  const badge = statusColors[item.status];
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
              { backgroundColor: badge.bg, borderColor: badge.border },
            ]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>
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
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const statusColors = useMemo(() => getStatusColors(colors), [colors]);

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
    <View style={styles.screen}>
      <StaffAppBar
        title="Clients"
        subtitle="Préférences, notes et historique"
        displayTitle
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
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
          placeholderTextColor={colors.textDim}
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
              styles={styles}
              statusColors={statusColors}
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

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    statCard: {
      flex: 1,
      backgroundColor: colors.primarySurface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      alignItems: "center",
    },
    statValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: ownerFonts.bold,
    },
    statLabel: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.medium,
    },
    search: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.card,
      marginBottom: 10,
      fontFamily: ownerFonts.regular,
    },
    chips: { gap: 8, paddingBottom: 12 },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.card,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySurface,
    },
    chipText: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    chipTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    row: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primarySurface,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
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
      color: colors.text,
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
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
  });
}
