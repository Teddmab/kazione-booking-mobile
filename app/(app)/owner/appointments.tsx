import { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";

import { QueryState } from "@/components/owner/QueryState";
import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import {
  useOwnerAppointments,
  useUpdateOwnerAppointmentStatus,
} from "@/hooks/useOwnerAppointments";
import {
  clientDisplayName,
  formatCurrency,
  formatDate,
  formatTime,
  toIsoDate,
} from "@/lib/format";
import type { AppointmentStatus, AppointmentWithRelations } from "@/types/owner";

const STATUS_ACTIONS: { status: AppointmentStatus; label: string }[] = [
  { status: "confirmed", label: "Confirmer" },
  { status: "completed", label: "Terminer" },
  { status: "cancelled", label: "Annuler" },
  { status: "no_show", label: "Absent" },
];

function AppointmentRow({
  item,
  onStatus,
}: {
  item: AppointmentWithRelations;
  onStatus: (id: string, status: AppointmentStatus) => void;
}) {
  const name = clientDisplayName(item.client.first_name, item.client.last_name);

  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.time}>{formatTime(item.starts_at)}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.date}>{formatDate(item.starts_at)}</Text>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.meta}>
        {item.service.name} · {item.staff?.display_name ?? "Sans préférence"}
      </Text>
      <Text style={styles.ref}>
        {item.booking_reference} · {formatCurrency(item.price)}
      </Text>
      <View style={styles.actions}>
        {STATUS_ACTIONS.filter((a) => a.status !== item.status).map((a) => (
          <Pressable
            key={a.status}
            style={styles.actionBtn}
            onPress={() => onStatus(item.id, a.status)}>
            <Text style={styles.actionText}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function OwnerAppointmentsScreen() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const today = toIsoDate(new Date());
  const weekEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toIsoDate(d);
  }, []);

  const [range, setRange] = useState<"today" | "week">("today");
  const filters = useMemo(
    () => ({
      dateFrom: today,
      dateTo: range === "today" ? today : weekEnd,
      limit: 50,
    }),
    [today, weekEnd, range],
  );

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useOwnerAppointments(businessId, filters);
  const updateStatus = useUpdateOwnerAppointmentStatus(businessId);

  const appointments = data?.appointments ?? [];

  const onStatus = (id: string, status: AppointmentStatus) => {
    Alert.alert("Changer le statut", `Passer ce rendez-vous en « ${status} » ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "OK",
        onPress: () => {
          updateStatus.mutate(
            { id, status },
            {
              onError: (e) => Alert.alert("Erreur", e.message),
            },
          );
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, range === "today" && styles.tabActive]}
          onPress={() => setRange("today")}>
          <Text style={[styles.tabText, range === "today" && styles.tabTextActive]}>
            Aujourd'hui
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, range === "week" && styles.tabActive]}
          onPress={() => setRange("week")}>
          <Text style={[styles.tabText, range === "week" && styles.tabTextActive]}>
            7 jours
          </Text>
        </Pressable>
      </View>

      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && appointments.length === 0}
        emptyMessage="Aucun rendez-vous sur cette période."
        onRetry={() => void refetch()}>
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderItem={({ item }) => (
            <AppointmentRow item={item} onStatus={onStatus} />
          )}
        />
      </QueryState>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  tabs: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  tabActive: {
    backgroundColor: ownerColors.primaryMuted,
    borderColor: ownerColors.primary,
  },
  tabText: { fontSize: 14, fontWeight: "500", color: ownerColors.textMuted },
  tabTextActive: { color: ownerColors.primary, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 12,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: { fontSize: 16, fontWeight: "700", color: ownerColors.primary },
  date: { fontSize: 12, color: ownerColors.textDim, marginTop: 2, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  meta: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4 },
  ref: { fontSize: 12, color: ownerColors.textDim, marginTop: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  actionText: { fontSize: 12, fontWeight: "600", color: ownerColors.primary },
});
