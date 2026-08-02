import { Pressable, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";
import { clientDisplayName, formatCurrency, formatTime } from "@/lib/format";
import type { StaffAppointment } from "@/services/staff/appointments";

const STRIP: Record<string, string> = {
  pending: ownerColors.warning,
  confirmed: ownerColors.primary,
  in_progress: ownerColors.primaryLight,
  completed: ownerColors.success,
  no_show: ownerColors.danger,
  cancelled: ownerColors.textDim,
};

interface Props {
  appointment: StaffAppointment;
  onPress: (appointment: StaffAppointment) => void;
}

export function TodayAppointmentCard({ appointment, onPress }: Props) {
  const strip = STRIP[appointment.status] ?? STRIP.pending;
  const name = clientDisplayName(
    appointment.client.first_name,
    appointment.client.last_name,
  );
  const duration = appointment.service.duration_minutes || appointment.duration_minutes;
  const price = appointment.service.price || appointment.price;

  return (
    <Pressable style={styles.card} onPress={() => onPress(appointment)}>
      <View style={[styles.strip, { backgroundColor: strip }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.time}>
            {formatTime(appointment.starts_at)} – {formatTime(appointment.ends_at)}
          </Text>
          <StatusBadge status={appointment.status} />
        </View>
        <Text style={styles.client}>{name}</Text>
        <Text style={styles.service}>{appointment.service.name}</Text>
        <Text style={styles.meta}>
          {duration} min · {formatCurrency(price)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...ownerStyles.card,
    flexDirection: "row",
    padding: 0,
    overflow: "hidden",
    marginBottom: 10,
  },
  strip: { width: 4 },
  body: { flex: 1, padding: 14, gap: 2 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.semiBold,
  },
  client: {
    fontSize: 16,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  service: {
    fontSize: 14,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  meta: {
    fontSize: 12,
    color: ownerColors.textDim,
    marginTop: 4,
    fontFamily: ownerFonts.regular,
  },
});
