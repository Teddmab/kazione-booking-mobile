import { Pressable, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerColors } from "@/constants/ownerTheme";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import type { AppointmentWithRelations } from "@/types/owner";

interface Props {
  appointment: AppointmentWithRelations;
  onPress?: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function StaffAppointmentCard({ appointment, onPress }: Props) {
  const clientName = clientDisplayName(
    appointment.client.first_name,
    appointment.client.last_name,
  );
  const earned = appointment.commission_earned;
  const pct =
    earned != null && appointment.price > 0
      ? Math.round((earned / appointment.price) * 100)
      : null;

  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.topRow}>
        <Text style={styles.time}>{formatTime(appointment.starts_at)}</Text>
        <StatusBadge status={appointment.status} />
      </View>
      <Text style={styles.service}>{appointment.service.name}</Text>
      <Text style={styles.client}>Client: {clientName}</Text>
      <Text style={styles.meta}>
        {formatDate(appointment.starts_at)} · {appointment.duration_minutes} min
      </Text>
      {earned != null ? (
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Earnings</Text>
          <Text style={styles.earningsValue}>
            {formatCurrency(earned, appointment.service.price ? undefined : "EUR")}
            {pct != null ? ` (${pct}%)` : ""}
          </Text>
        </View>
      ) : null}
      <Text style={styles.ref}>{appointment.booking_reference}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  time: { fontSize: 16, fontWeight: "700", color: ownerColors.text },
  service: { fontSize: 15, fontWeight: "600", color: ownerColors.text, marginTop: 8 },
  client: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4 },
  meta: { fontSize: 13, color: ownerColors.textDim, marginTop: 4 },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: ownerColors.border,
  },
  earningsLabel: { fontSize: 13, color: ownerColors.textMuted },
  earningsValue: { fontSize: 15, fontWeight: "700", color: "#15803d" },
  ref: { fontSize: 11, color: ownerColors.textDim, marginTop: 6 },
});
