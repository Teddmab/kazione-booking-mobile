import { useRouter, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";

import { AppointmentDetailSheet } from "@/components/owner/AppointmentDetailSheet";
import { AppointmentListView } from "@/components/owner/AppointmentListView";
import { OwnerAddHeaderButton } from "@/components/owner/OwnerAddHeaderButton";
import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { QueryState } from "@/components/owner/QueryState";
import { RescheduleSheet } from "@/components/owner/RescheduleSheet";
import { WeekCalendarView } from "@/components/owner/WeekCalendarView";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerCalendar } from "@/hooks/useOwnerCalendar";
import {
  useCancelOwnerAppointment,
  useRescheduleOwnerAppointment,
  useUpdateOwnerAppointmentStatus,
} from "@/hooks/useOwnerAppointments";
import { useOwnerAppointmentsRealtime } from "@/hooks/useOwnerRealtime";
import { formatWeekRangeLabel } from "@/lib/ownerCalendar";
import type { AppointmentStatus, AppointmentWithRelations } from "@/types/owner";

type ViewMode = "week" | "list";

export default function OwnerAppointmentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  useOwnerAppointmentsRealtime(businessId);

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
  } = useOwnerCalendar(businessId);

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentWithRelations | null>(
    null,
  );

  const updateStatus = useUpdateOwnerAppointmentStatus(businessId);
  const cancelAppt = useCancelOwnerAppointment(businessId);
  const rescheduleAppt = useRescheduleOwnerAppointment(businessId);

  const busy =
    updateStatus.isPending || cancelAppt.isPending || rescheduleAppt.isPending;

  const openDetail = useCallback((appt: AppointmentWithRelations) => {
    setSelected(appt);
    setSheetOpen(true);
  }, []);

  const onStatus = (id: string, status: AppointmentStatus) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => {
          setSheetOpen(false);
          void refetch();
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
          void refetch();
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
        void refetch();
      },
      onError: (e) => Alert.alert("Erreur", e.message),
    });
  };

  return (
    <View style={styles.flex}>
      <OwnerAppBar
        title={t("owner.appointments")}
        rightSlot={
          <OwnerAddHeaderButton
            compact
            onPress={() => router.push("/(app)/owner/walk-in" as Href)}
          />
        }
      />
      <View style={styles.weekNav}>
        <Pressable onPress={goPrevWeek} style={styles.navBtn}>
          <Text style={styles.navBtnText}>←</Text>
        </Pressable>
        <Pressable onPress={goToday} style={styles.rangeCenter}>
          <Text style={styles.rangeText}>{formatWeekRangeLabel(weekStart)}</Text>
          <Text style={styles.todayHint}>Aujourd&apos;hui</Text>
        </Pressable>
        <Pressable onPress={goNextWeek} style={styles.navBtn}>
          <Text style={styles.navBtnText}>→</Text>
        </Pressable>
      </View>

      <View style={styles.toggle}>
        <Pressable
          style={[styles.toggleBtn, viewMode === "week" && styles.toggleActive]}
          onPress={() => setViewMode("week")}>
          <Text style={[styles.toggleText, viewMode === "week" && styles.toggleTextActive]}>
            Semaine
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, viewMode === "list" && styles.toggleActive]}
          onPress={() => setViewMode("list")}>
          <Text style={[styles.toggleText, viewMode === "list" && styles.toggleTextActive]}>
            Liste
          </Text>
        </Pressable>
      </View>

      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && appointments.length === 0}
        emptyMessage="Aucun rendez-vous cette semaine."
        onRetry={() => void refetch()}>
        {viewMode === "week" ? (
          <WeekCalendarView weekStart={weekStart} byDay={byDay} onSelect={openDetail} />
        ) : (
          <AppointmentListView
            appointments={appointments}
            isRefetching={isRefetching}
            onRefresh={() => void refetch()}
            onSelect={openDetail}
          />
        )}
      </QueryState>

      {busy ? (
        <View style={styles.busyOverlay}>
          <ActivityIndicator color={ownerColors.primary} />
        </View>
      ) : null}

      <AppointmentDetailSheet
        appointment={selected}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onConfirmStatus={onStatus}
        onCancel={onCancel}
        onReschedule={(appt) => {
          setRescheduleTarget(appt);
          setSheetOpen(false);
        }}
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
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnText: { fontSize: 18, color: ownerColors.primary, fontWeight: "600" },
  rangeCenter: { flex: 1, alignItems: "center" },
  rangeText: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  todayHint: { fontSize: 11, color: ownerColors.primary, marginTop: 2 },
  toggle: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 10,
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  toggleActive: {
    backgroundColor: ownerColors.primaryMuted,
    borderColor: ownerColors.primary,
  },
  toggleText: { fontSize: 14, fontWeight: "500", color: ownerColors.textMuted },
  toggleTextActive: { color: ownerColors.primary, fontWeight: "600" },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
