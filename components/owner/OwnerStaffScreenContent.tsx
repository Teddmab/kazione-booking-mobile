import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { InviteStaffSheet, type InviteStaffValues } from "@/components/owner/InviteStaffSheet";
import { OwnerAddHeaderButton } from "@/components/owner/OwnerAddHeaderButton";
import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { QueryState } from "@/components/owner/QueryState";
import { StaffDetailSheet, type StaffUpdateValues } from "@/components/owner/StaffDetailSheet";
import { StaffScheduleSheet } from "@/components/owner/StaffScheduleSheet";
import { StaffServicesSheet } from "@/components/owner/StaffServicesSheet";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerServices } from "@/hooks/useOwnerServices";
import {
  useActivateStaffInvite,
  useAssignStaffServices,
  useInviteStaff,
  useOwnerStaff,
  useResendStaffInvite,
  useStaffSchedule,
  useStaffServices,
  useUpdateStaffMember,
} from "@/hooks/useOwnerStaff";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  buildStaffRankMap,
  dateRangeForStaffPeriod,
  performanceScore,
  sortStaffPerformance,
  type StaffPerfPeriod,
  type StaffPerfSort,
} from "@/lib/staffPerfPeriod";
import { getStaffPerformance } from "@/services/owner/finance";
import type { StaffPerformanceRow } from "@/types/finance";
import type { StaffMember, StaffWorkingDay } from "@/types/owner";

type StatusFilter = "all" | "active" | "inactive";

function StaffRow({
  item,
  perf,
  rank,
  onPress,
  onSchedule,
  onServices,
}: {
  item: StaffMember;
  perf?: StaffPerformanceRow;
  rank?: number;
  onPress: () => void;
  onSchedule: () => void;
  onServices: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.rowTop}>
        <View style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.display_name}
            </Text>
            {rank != null ? (
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>#{rank}</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.badge, !item.is_active && styles.badgeOff]}>
            <Text style={styles.badgeText}>{item.is_active ? "Actif" : "Inactif"}</Text>
          </View>
        </View>
        <View style={styles.rowActions}>
          <Pressable
            style={styles.iconBtn}
            onPress={onSchedule}
            accessibilityLabel="Horaires">
            <Ionicons name="time-outline" size={18} color={ownerColors.primary} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={onServices}
            accessibilityLabel="Services">
            <Ionicons name="briefcase-outline" size={18} color={ownerColors.primary} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.role}>{item.role}</Text>
      {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
      <Text style={styles.perfLine}>
        {formatCurrency(perf?.revenue ?? 0)} · {perf?.bookings ?? 0} RDV ·{" "}
        {(perf?.avg_rating ?? 0).toFixed(1)} ★
      </Text>
    </Pressable>
  );
}

interface Props {
  variant: "tab" | "stack";
}

export function OwnerStaffScreenContent({ variant }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  const { data, isLoading, isError, error, refetch, isRefetching } = useOwnerStaff(businessId);
  const { data: services = [] } = useOwnerServices(businessId);
  const invite = useInviteStaff(businessId);
  const updateMember = useUpdateStaffMember(businessId);
  const activateInvite = useActivateStaffInvite(businessId);
  const saveSchedule = useStaffSchedule(businessId);
  const assignServices = useAssignStaffServices(businessId);
  const resendInvite = useResendStaffInvite(businessId);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMetric, setSortMetric] = useState<StaffPerfSort>("revenue");
  const [period, setPeriod] = useState<StaffPerfPeriod>("30d");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const dateRange = useMemo(() => dateRangeForStaffPeriod(period), [period]);

  const { data: performanceData = [] } = useQuery({
    queryKey: ["owner-finance", "staff-perf", businessId, dateRange.from, dateRange.to],
    queryFn: () => getStaffPerformance(businessId, dateRange),
    enabled: !!businessId,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const servicesQuery = useStaffServices(servicesOpen ? selected?.id ?? null : null);
  const openInvite = useCallback(() => setInviteOpen(true), []);
  const staff = data ?? [];

  const pendingInvites = useMemo(
    () => staff.filter((member) => member.is_pending_invite),
    [staff],
  );

  const activeMembers = useMemo(
    () => staff.filter((member) => !member.is_pending_invite),
    [staff],
  );

  const performanceByStaff = useMemo(
    () => new Map(performanceData.map((row) => [row.staff_profile_id, row])),
    [performanceData],
  );

  const rankMap = useMemo(() => {
    const sorted = sortStaffPerformance(performanceData, sortMetric);
    return buildStaffRankMap(sorted);
  }, [performanceData, sortMetric]);

  const sortedStaffIds = useMemo(() => {
    return sortStaffPerformance(performanceData, sortMetric).map((row) => row.staff_profile_id);
  }, [performanceData, sortMetric]);

  const filteredStaff = useMemo(() => {
    const byFilter = activeMembers.filter((member) => {
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && member.is_active) ||
        (statusFilter === "inactive" && !member.is_active);
      const queryMatch =
        !debouncedSearch ||
        member.display_name.toLowerCase().includes(debouncedSearch) ||
        member.role.toLowerCase().includes(debouncedSearch);
      return statusMatch && queryMatch;
    });

    const rankedOrder = new Map(sortedStaffIds.map((id, index) => [id, index]));
    return [...byFilter].sort((a, b) => {
      const aRank = rankedOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bRank = rankedOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      return (
        performanceScore(performanceByStaff.get(b.id)) -
        performanceScore(performanceByStaff.get(a.id))
      );
    });
  }, [activeMembers, debouncedSearch, statusFilter, sortedStaffIds, performanceByStaff]);

  const selectedPerformance = selected ? performanceByStaff.get(selected.id) : undefined;

  const onInvite = (values: InviteStaffValues) => {
    invite.mutate(values, {
      onSuccess: (res) => {
        setInviteOpen(false);
        Alert.alert("Invitation envoyée", `Un email a été envoyé à ${res.email}.`);
        void refetch();
      },
      onError: (e) => Alert.alert("Erreur", e.message),
    });
  };

  const onSaveStaff = (id: string, values: StaffUpdateValues) => {
    updateMember.mutate(
      { id, values },
      {
        onSuccess: () => {
          setDetailOpen(false);
          Alert.alert("Enregistré", "Membre mis à jour.");
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  const onSaveSchedule = (schedule: StaffWorkingDay[]) => {
    if (!selected) return;
    saveSchedule.mutate(
      { staffId: selected.id, schedule },
      {
        onSuccess: () => {
          setScheduleOpen(false);
          Alert.alert("Enregistré", "Horaires mis à jour.");
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  const onSaveServices = (serviceIds: string[]) => {
    if (!selected) return;
    assignServices.mutate(
      { staffId: selected.id, serviceIds },
      {
        onSuccess: () => {
          setServicesOpen(false);
          Alert.alert("Enregistré", "Services assignés.");
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  const onResendInvite = (member: StaffMember) => {
    setPendingActionId(member.id);
    resendInvite.mutate(member.id, {
      onSuccess: (res) => {
        setPendingActionId(null);
        Alert.alert(
          res.invite_sent ? "Invitation renvoyée" : "Échec envoi",
          res.invite_sent
            ? `Email envoyé à ${res.email}`
            : (res.email_error ?? "Erreur email"),
        );
      },
      onError: (e) => {
        setPendingActionId(null);
        Alert.alert("Erreur", e.message);
      },
    });
  };

  const onActivateInvite = (member: StaffMember) => {
    setPendingActionId(member.id);
    activateInvite.mutate(member.id, {
      onSuccess: () => {
        setPendingActionId(null);
        Alert.alert("Membre activé", `${member.display_name} est maintenant actif.`);
      },
      onError: (e) => {
        setPendingActionId(null);
        Alert.alert("Erreur", e.message);
      },
    });
  };

  const onResendSelectedInvite = () => {
    if (!selected) return;
    onResendInvite(selected);
  };

  const openScheduleFor = (member: StaffMember) => {
    setSelected(member);
    setScheduleOpen(true);
  };

  const openServicesFor = (member: StaffMember) => {
    setSelected(member);
    setServicesOpen(true);
  };

  const onNewBooking = (staffId: string, staffName: string) => {
    setDetailOpen(false);
    router.push({
      pathname: "/(app)/owner/walk-in",
      params: { staffId, staffName },
    } as Href);
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      {pendingInvites.length > 0 ? (
        <View style={styles.pendingCard}>
          <View style={styles.pendingHeader}>
            <Text style={styles.pendingTitle}>Invitations en attente</Text>
            <View style={styles.pendingCount}>
              <Text style={styles.pendingCountText}>{pendingInvites.length}</Text>
            </View>
          </View>
          {pendingInvites.map((inv, index) => {
            const busy = pendingActionId === inv.id;
            return (
              <View
                key={inv.id}
                style={[styles.pendingRow, index > 0 && styles.pendingRowBorder]}>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingName}>{inv.display_name}</Text>
                  <Text style={styles.meta}>
                    {inv.email ?? "Email inconnu"} · {inv.role}
                  </Text>
                  {inv.invited_at ? (
                    <Text style={styles.pendingDate}>
                      Invité le {formatDate(inv.invited_at)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.pendingActions}>
                  <Pressable
                    style={[styles.activateBtn, busy && styles.btnDisabled]}
                    disabled={busy}
                    onPress={() => onActivateInvite(inv)}>
                    <Text style={styles.activateBtnText}>Activer</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.resendBtn, busy && styles.btnDisabled]}
                    disabled={busy}
                    onPress={() => onResendInvite(inv)}>
                    <Text style={styles.resendBtnText}>Renvoyer</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher un membre…"
        placeholderTextColor={ownerColors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TabChipSelector
        value={statusFilter}
        chips={[
          { key: "all", label: t("owner.staffFilterAll", { defaultValue: "Tous" }) },
          { key: "active", label: t("owner.staffFilterActive", { defaultValue: "Actifs" }) },
          { key: "inactive", label: t("owner.staffFilterInactive", { defaultValue: "Inactifs" }) },
        ]}
        onChange={setStatusFilter}
      />

      <Text style={styles.toolbarLabel}>Tri</Text>
      <TabChipSelector
        value={sortMetric}
        chips={[
          { key: "revenue", label: "Revenus" },
          { key: "bookings", label: "Réservations" },
          { key: "rating", label: "Note" },
          { key: "completion", label: "Complétion" },
        ]}
        onChange={setSortMetric}
      />

      <Text style={styles.toolbarLabel}>Période</Text>
      <TabChipSelector
        value={period}
        chips={[
          { key: "7d", label: "7j" },
          { key: "30d", label: "30j" },
          { key: "90d", label: "90j" },
        ]}
        onChange={setPeriod}
      />
    </View>
  );

  const body = (
    <>
      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && filteredStaff.length === 0}
        emptyMessage="Aucun membre. Appuyez sur + pour inviter."
        onRetry={() => void refetch()}>
        <FlatList
          data={filteredStaff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderItem={({ item }) => (
            <StaffRow
              item={item}
              perf={performanceByStaff.get(item.id)}
              rank={rankMap.get(item.id)}
              onPress={() => {
                setSelected(item);
                setDetailOpen(true);
              }}
              onSchedule={() => openScheduleFor(item)}
              onServices={() => openServicesFor(item)}
            />
          )}
        />
      </QueryState>

      <InviteStaffSheet
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={onInvite}
        busy={invite.isPending}
      />

      <StaffDetailSheet
        member={selected}
        businessId={businessId}
        dateRange={dateRange}
        performanceStats={
          selectedPerformance
            ? {
                revenue: selectedPerformance.revenue,
                bookings: selectedPerformance.bookings,
                avg_rating: selectedPerformance.avg_rating,
                completion_rate: selectedPerformance.completion_rate,
              }
            : undefined
        }
        visible={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSave={onSaveStaff}
        onEditSchedule={() => {
          setDetailOpen(false);
          setScheduleOpen(true);
        }}
        onEditServices={() => {
          setDetailOpen(false);
          setServicesOpen(true);
        }}
        onNewBooking={onNewBooking}
        onResendInvite={selected?.is_pending_invite ? onResendSelectedInvite : undefined}
        busy={updateMember.isPending}
        resendBusy={resendInvite.isPending}
      />

      <StaffScheduleSheet
        member={selected}
        visible={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSave={onSaveSchedule}
        busy={saveSchedule.isPending}
      />

      <StaffServicesSheet
        member={selected}
        visible={servicesOpen}
        services={services}
        assignedIds={servicesQuery.data?.service_ids ?? []}
        loading={servicesQuery.isLoading}
        onClose={() => setServicesOpen(false)}
        onSave={onSaveServices}
        busy={assignServices.isPending}
      />
    </>
  );

  if (variant === "tab") {
    return (
      <View style={styles.flex}>
        <OwnerAppBar
          title={t("owner.staff")}
          rightSlot={<OwnerAddHeaderButton onPress={openInvite} />}
        />
        {body}
      </View>
    );
  }

  return (
    <OwnerStackShell
      title={t("owner.staff")}
      rightSlot={<OwnerAddHeaderButton onPress={openInvite} />}>
      {body}
    </OwnerStackShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  list: { padding: 16, paddingTop: 0 },
  headerBlock: { paddingTop: 16, paddingBottom: 8, gap: 8 },
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
  toolbarLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: ownerColors.textDim,
    marginTop: 4,
  },
  pendingCard: {
    borderWidth: 1,
    borderColor: ownerColors.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
    backgroundColor: ownerColors.primaryMuted,
  },
  pendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  pendingTitle: { fontSize: 15, fontWeight: "700", color: ownerColors.text, flex: 1 },
  pendingCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ownerColors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  pendingCountText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  pendingRow: {
    gap: 10,
  },
  pendingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: ownerColors.border,
    paddingTop: 10,
    marginTop: 10,
  },
  pendingInfo: { gap: 2 },
  pendingName: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  pendingDate: { fontSize: 11, color: ownerColors.textDim, marginTop: 2 },
  pendingActions: { flexDirection: "row", gap: 8 },
  activateBtn: {
    flex: 1,
    backgroundColor: ownerColors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  activateBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  resendBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: ownerColors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: ownerColors.card,
  },
  resendBtnText: { color: ownerColors.primary, fontWeight: "600", fontSize: 13 },
  btnDisabled: { opacity: 0.5 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  nameBlock: { flex: 1, marginRight: 8 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text, flexShrink: 1 },
  rankBadge: {
    backgroundColor: ownerColors.primaryMuted,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: ownerColors.primary,
  },
  rankBadgeText: { fontSize: 11, fontWeight: "700", color: ownerColors.primary },
  rowActions: { flexDirection: "row", gap: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ownerColors.bg,
  },
  role: { fontSize: 14, color: ownerColors.primary, marginTop: 6, textTransform: "capitalize" },
  meta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
  perfLine: { fontSize: 12, color: ownerColors.textDim, marginTop: 8 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
  },
  badgeOff: { backgroundColor: "#f5f5f5" },
  badgeText: { fontSize: 11, fontWeight: "600", color: ownerColors.textMuted },
});
