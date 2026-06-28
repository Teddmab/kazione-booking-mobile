import { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { QueryState } from "@/components/owner/QueryState";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { StaffAppointmentCard } from "@/components/staff/StaffAppointmentCard";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useStaffAppointments } from "@/hooks/useStaffAppointments";
import { formatCurrency } from "@/lib/format";
import { roleLabel } from "@/lib/workspaceRouting";
import { toIsoDateLocal } from "@/lib/ownerCalendar";

type FilterKey = "today" | "week" | "upcoming";

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfWeekMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default function StaffAppointmentsScreen() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [filter, setFilter] = useState<FilterKey>("today");

  const dateFilters = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (filter === "today") {
      const iso = toIsoDateLocal(today);
      return { dateFrom: iso, dateTo: iso };
    }
    if (filter === "week") {
      const start = startOfWeekMonday(today);
      const end = addDays(start, 6);
      return { dateFrom: toIsoDateLocal(start), dateTo: toIsoDateLocal(end) };
    }
    return { dateFrom: toIsoDateLocal(today), dateTo: toIsoDateLocal(addDays(today, 90)) };
  }, [filter]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useStaffAppointments(
    businessId,
    dateFilters,
  );

  const appointments = useMemo(() => {
    const list = data?.appointments ?? [];
    const now = Date.now();
    const sorted = [...list].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
    if (filter === "upcoming") {
      return sorted.filter(
        (a) =>
          new Date(a.starts_at).getTime() >= now &&
          a.status !== "cancelled" &&
          a.status !== "no_show",
      );
    }
    return sorted;
  }, [data, filter]);

  const totalEarnings = useMemo(
    () =>
      appointments.reduce((sum, a) => sum + (a.commission_earned ?? 0), 0),
    [appointments],
  );

  const filterChips = [
    { key: "today" as const, label: "Today" },
    { key: "week" as const, label: "This week" },
    { key: "upcoming" as const, label: "Upcoming" },
  ];

  const headerTitle = tenant
    ? `${tenant.businessName}${tenant.position ? ` · ${tenant.position}` : ""}`
    : "";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My appointments</Text>
        {headerTitle ? <Text style={styles.subtitle}>{headerTitle}</Text> : null}
        {tenant ? (
          <Text style={styles.role}>{roleLabel(tenant.role, tenant.position)}</Text>
        ) : null}
      </View>

      <View style={styles.filters}>
        <TabChipSelector value={filter} chips={filterChips} onChange={setFilter} />
      </View>

      {totalEarnings > 0 ? (
        <View style={styles.earningsBanner}>
          <Text style={styles.earningsBannerLabel}>Period earnings</Text>
          <Text style={styles.earningsBannerValue}>{formatCurrency(totalEarnings)}</Text>
        </View>
      ) : null}

      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && appointments.length === 0}
        emptyMessage="No appointments for this period."
        onRetry={() => void refetch()}>
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderItem={({ item }) => <StaffAppointmentCard appointment={item} />}
        />
      </QueryState>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ownerColors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: "700", color: ownerColors.text },
  subtitle: { fontSize: 15, color: ownerColors.text, marginTop: 4, fontWeight: "600" },
  role: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
  filters: { paddingHorizontal: 16, paddingVertical: 8 },
  earningsBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningsBannerLabel: { fontSize: 13, color: "#166534" },
  earningsBannerValue: { fontSize: 16, fontWeight: "700", color: "#15803d" },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});
