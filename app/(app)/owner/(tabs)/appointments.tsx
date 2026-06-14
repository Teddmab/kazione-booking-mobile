import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppointmentDetailSheet } from "@/components/owner/AppointmentDetailSheet";
import { AppointmentListView } from "@/components/owner/AppointmentListView";
import { OverlapBanner } from "@/components/owner/OverlapBanner";
import { OwnerAddHeaderButton } from "@/components/owner/OwnerAddHeaderButton";
import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { QueryState } from "@/components/owner/QueryState";
import { RescheduleSheet } from "@/components/owner/RescheduleSheet";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { UpcomingStrip } from "@/components/owner/UpcomingStrip";
import { WeekCalendarView } from "@/components/owner/WeekCalendarView";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerCalendar } from "@/hooks/useOwnerCalendar";
import {
  useCancelOwnerAppointment,
  useDeleteOwnerAppointment,
  useOwnerAppointments,
  useRescheduleOwnerAppointment,
  useUpdateOwnerAppointmentStatus,
} from "@/hooks/useOwnerAppointments";
import { useOwnerAppointmentsRealtime } from "@/hooks/useOwnerRealtime";
import { computeAppointmentFlags } from "@/lib/appointmentFlags";
import { computeStaffOverlaps } from "@/lib/appointmentOverlaps";
import { formatWeekRangeLabel, toIsoDateLocal } from "@/lib/ownerCalendar";
import type { AppointmentStatus, AppointmentWithRelations } from "@/types/owner";

type ViewMode = "week" | "list";

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export default function OwnerAppointmentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  useOwnerAppointmentsRealtime(businessId);

  const [staffFilter, setStaffFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentWithRelations | null>(
    null,
  );
  const [dismissedOverlapKeys, setDismissedOverlapKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [overlapExpanded, setOverlapExpanded] = useState(false);

  const staffIdParam = staffFilter === "all" ? undefined : staffFilter;

  const {
    weekStart,
    byDay,
    appointments,
    goPrevWeek,
    goNextWeek,
    goToday,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useOwnerCalendar(businessId, staffIdParam);

  const upcomingFilters = useMemo(
    () => ({
      dateFrom: toIsoDateLocal(new Date()),
      dateTo: toIsoDateLocal(addDays(new Date(), 30)),
      limit: 50,
    }),
    [],
  );

  const upcomingQuery = useOwnerAppointments(businessId, upcomingFilters);

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();
    return (upcomingQuery.data?.appointments ?? [])
      .filter(
        (a) => new Date(a.starts_at).getTime() >= now && a.status !== "cancelled",
      )
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [upcomingQuery.data]);

  const appointmentFlags = useMemo(
    () => computeAppointmentFlags(upcomingQuery.data?.appointments ?? []),
    [upcomingQuery.data],
  );

  const overlaps = useMemo(
    () => computeStaffOverlaps(upcomingAppointments),
    [upcomingAppointments],
  );

  const activeOverlaps = useMemo(
    () => overlaps.filter((o) => !dismissedOverlapKeys.has(o.key)),
    [overlaps, dismissedOverlapKeys],
  );

  const staffChips = useMemo(() => {
    const map = new Map<string, { id: string; display_name: string }>();
    for (const a of appointments) {
      if (a.staff) map.set(a.staff.id, a.staff);
    }
    return [
      { key: "all" as const, label: "Tout le personnel" },
      ...Array.from(map.values()).map((s) => ({
        key: s.id,
        label: s.display_name,
      })),
    ];
  }, [appointments]);

  const updateStatus = useUpdateOwnerAppointmentStatus(businessId);
  const cancelAppt = useCancelOwnerAppointment(businessId);
  const rescheduleAppt = useRescheduleOwnerAppointment(businessId);
  const deleteAppt = useDeleteOwnerAppointment(businessId);

  const busy =
    updateStatus.isPending || cancelAppt.isPending || rescheduleAppt.isPending || deleteAppt.isPending;

  const openDetail = useCallback((appt: AppointmentWithRelations) => {
    setSelected(appt);
    setSheetOpen(true);
  }, []);

  const refreshAll = useCallback(() => {
    void refetch();
    void upcomingQuery.refetch();
  }, [refetch, upcomingQuery]);

  const onStatus = (id: string, status: AppointmentStatus) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => {
          setSheetOpen(false);
          refreshAll();
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  const onCancel = (id: string, reason: string) => {
    cancelAppt.mutate(
      { id, reason },
      {
        onSuccess: () => {
          setSheetOpen(false);
          Alert.alert("Annulé", "Le rendez-vous a été annulé.");
          refreshAll();
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  const onRescheduleConfirm = (params: {
    appointment_id: string;
    new_date: string;
    new_time: string;
    staff_profile_id: string | null;
  }) => {
    rescheduleAppt.mutate(params, {
      onSuccess: () => {
        setRescheduleTarget(null);
        setSheetOpen(false);
        Alert.alert("Reprogrammé", "Le rendez-vous a été déplacé.");
        refreshAll();
      },
      onError: (e) => Alert.alert("Erreur", e.message),
    });
  };

  const isWeekView = viewMode === "week";

  return (
    <View style={styles.flex}>
      <OwnerAppBar
        title={t("owner.appointments")}
        rightSlot={
          <View style={styles.appBarActions}>
            <View style={styles.viewToggle}>
              <Pressable
                style={[styles.viewToggleBtn, viewMode === "week" && styles.viewToggleBtnActive]}
                onPress={() => setViewMode("week")}
                accessibilityLabel="Vue calendrier">
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={viewMode === "week" ? "#fff" : ownerColors.textMuted}
                />
              </Pressable>
              <Pressable
                style={[styles.viewToggleBtn, viewMode === "list" && styles.viewToggleBtnActive]}
                onPress={() => setViewMode("list")}
                accessibilityLabel="Vue liste">
                <Ionicons
                  name="list-outline"
                  size={22}
                  color={viewMode === "list" ? "#fff" : ownerColors.textMuted}
                />
              </Pressable>
            </View>
            <OwnerAddHeaderButton
              compact
              onPress={() => router.push("/(app)/owner/walk-in" as Href)}
            />
          </View>
        }
        bottomSlot={
          <View style={styles.weekNavBar}>
            <Pressable onPress={goPrevWeek} style={styles.weekNavBtn} accessibilityLabel="Semaine précédente">
              <Ionicons name="chevron-back" size={20} color={ownerColors.primary} />
            </Pressable>
            <Pressable onPress={goToday} style={styles.weekNavCenter} accessibilityLabel="Aujourd'hui">
              <Text style={styles.weekNavLabel}>{formatWeekRangeLabel(weekStart)}</Text>
            </Pressable>
            <Pressable onPress={goNextWeek} style={styles.weekNavBtn} accessibilityLabel="Semaine suivante">
              <Ionicons name="chevron-forward" size={20} color={ownerColors.primary} />
            </Pressable>
          </View>
        }
      />

      {isWeekView ? (
        <View style={styles.weekHeader}>
          <UpcomingStrip
            compact
            appointments={upcomingAppointments}
            flags={appointmentFlags}
            onPress={openDetail}
          />

          <OverlapBanner
            compact
            overlaps={activeOverlaps}
            expanded={overlapExpanded}
            onToggle={() => setOverlapExpanded((v) => !v)}
            onFix={(pair) => openDetail(pair.a)}
            onDismiss={(key) =>
              setDismissedOverlapKeys((prev) => new Set([...prev, key]))
            }
          />

          {staffChips.length > 1 ? (
            <View style={styles.staffFilterCompact}>
              <TabChipSelector
                dense
                value={staffFilter}
                chips={staffChips}
                onChange={setStaffFilter}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.contentArea}>
        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          empty={!isLoading && appointments.length === 0}
          emptyMessage="Aucun rendez-vous cette semaine."
          onRetry={refreshAll}>
          {isWeekView ? (
            <WeekCalendarView weekStart={weekStart} byDay={byDay} onSelect={openDetail} />
          ) : (
            <View style={styles.listWrap}>
              <AppointmentListView
                appointments={appointments}
                flags={appointmentFlags}
                isRefetching={isRefetching}
                onRefresh={refreshAll}
                onSelect={openDetail}
              />
            </View>
          )}
        </QueryState>
      </View>

      {busy ? (
        <View style={styles.busyOverlay}>
          <ActivityIndicator color={ownerColors.primary} />
        </View>
      ) : null}

      <AppointmentDetailSheet
        appointment={selected}
        businessId={businessId}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onConfirmStatus={onStatus}
        onCancel={onCancel}
        onReschedule={(appt) => {
          setRescheduleTarget(appt);
          setSheetOpen(false);
        }}
        onDelete={(id) => {
          deleteAppt.mutate(id, {
            onSuccess: () => {
              setSheetOpen(false);
              void refetch();
            },
            onError: (e) => Alert.alert("Erreur", e.message),
          });
        }}
        onAssigned={refreshAll}
        busy={busy}
      />

      <RescheduleSheet
        appointment={rescheduleTarget}
        businessId={businessId}
        visible={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onConfirm={onRescheduleConfirm}
        busy={rescheduleAppt.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  weekHeader: { flexGrow: 0, flexShrink: 0 },
  contentArea: { flex: 1, minHeight: 0 },
  listWrap: { flex: 1 },
  staffFilterCompact: { paddingHorizontal: 12, paddingTop: 2, paddingBottom: 4 },
  appBarActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  weekNavBar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  weekNavBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  weekNavCenter: {
    minWidth: 140,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  weekNavLabel: { fontSize: 13, fontWeight: "600", color: ownerColors.text },
  viewToggle: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    overflow: "hidden",
  },
  viewToggleBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ownerColors.card,
  },
  viewToggleBtnActive: {
    backgroundColor: ownerColors.primary,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
