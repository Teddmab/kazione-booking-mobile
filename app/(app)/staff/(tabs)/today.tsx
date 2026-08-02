import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { QueryState } from "@/components/owner/QueryState";
import { AppointmentStatusSheet } from "@/components/staff/AppointmentStatusSheet";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { TodayAppointmentCard } from "@/components/staff/TodayAppointmentCard";
import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";
import { useStaffAppointments } from "@/hooks/useStaffAppointments";
import { formatDateLong } from "@/lib/format";
import { toIsoDateLocal } from "@/lib/ownerCalendar";
import type { StaffAppointment } from "@/services/staff/appointments";

function Section({
  title,
  appointments,
  onPress,
}: {
  title: string;
  appointments: StaffAppointment[];
  onPress: (a: StaffAppointment) => void;
}) {
  if (appointments.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={ownerStyles.sectionTitle}>{title}</Text>
      {appointments.map((appt) => (
        <TodayAppointmentCard key={appt.id} appointment={appt} onPress={onPress} />
      ))}
    </View>
  );
}

export default function StaffTodayScreen() {
  const { i18n } = useTranslation();
  const today = toIsoDateLocal(new Date());
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useStaffAppointments(today, today);
  const [selected, setSelected] = useState<StaffAppointment | null>(null);

  const appointments = [...(data ?? [])].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
  const upcoming = appointments.filter((a) =>
    ["pending", "confirmed"].includes(a.status),
  );
  const active = appointments.filter((a) => a.status === "in_progress");
  const done = appointments.filter((a) =>
    ["completed", "no_show", "cancelled"].includes(a.status),
  );

  const remaining = upcoming.length + active.length;

  return (
    <View style={ownerStyles.screen}>
      <StaffAppBar
        title="Aujourd'hui"
        subtitle={formatDateLong(new Date(), i18n.language)}
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
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{appointments.length}</Text>
            <Text style={styles.summaryLabel}>RDV du jour</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{remaining}</Text>
            <Text style={styles.summaryLabel}>Restants</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{done.length}</Text>
            <Text style={styles.summaryLabel}>Terminés</Text>
          </View>
        </View>

        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          empty={!isLoading && appointments.length === 0}
          emptyMessage="Aucun rendez-vous prévu aujourd'hui"
          onRetry={() => void refetch()}>
          <Section title="En cours" appointments={active} onPress={setSelected} />
          <Section title="À venir" appointments={upcoming} onPress={setSelected} />
          <Section title="Terminés" appointments={done} onPress={setSelected} />
        </QueryState>
      </ScrollView>

      <AppointmentStatusSheet
        appointment={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: ownerColors.primarySurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: ownerColors.primary,
    fontFamily: ownerFonts.bold,
  },
  summaryLabel: {
    fontSize: 11,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.medium,
  },
  section: { marginBottom: 8 },
});
