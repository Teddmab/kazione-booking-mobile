import { StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import type { AppointmentWithRelations } from "@/types/owner";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  in_progress: "#8B5CF6",
  completed: "#10B981",
  cancelled: "#EF4444",
  no_show: "#6B7280",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

interface Props {
  appointment: AppointmentWithRelations;
}

export function StaffAppointmentCard({ appointment: appt }: Props) {
  const statusColor = STATUS_COLORS[appt.status] ?? "#6B7280";
  const clientName = `${appt.client.first_name} ${appt.client.last_name}`;
  const date = new Date(appt.starts_at);
  const dateLabel = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timeLabel = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.serviceName}>{appt.service.name}</Text>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.datetime}>{dateLabel} · {timeLabel}</Text>
        </View>
        <View style={styles.right}>
          <View style={[styles.badge, { backgroundColor: statusColor + "22", borderColor: statusColor }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {STATUS_LABELS[appt.status] ?? appt.status}
            </Text>
          </View>
          <Text style={styles.price}>EUR {appt.service.price.toFixed(2)}</Text>
          {appt.commission_earned != null && appt.commission_earned > 0 && (
            <Text style={styles.earning}>You earn: EUR {appt.commission_earned.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  left: { flex: 1 },
  right: { alignItems: "flex-end", gap: 4 },
  serviceName: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  clientName: { fontSize: 13, color: ownerColors.textDim, marginTop: 2 },
  datetime: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  price: { fontSize: 14, fontWeight: "700", color: ownerColors.text },
  earning: { fontSize: 11, color: ownerColors.primary, fontWeight: "500" },
});
