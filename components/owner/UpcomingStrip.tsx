import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  type AppointmentFlag,
  flagBorderColor,
} from "@/lib/appointmentFlags";
import { clientDisplayName, formatTime } from "@/lib/format";
import { ownerColors } from "@/constants/ownerTheme";
import type { AppointmentWithRelations } from "@/types/owner";

const STATUS_DOT: Record<string, string> = {
  confirmed: "#10B981",
  pending: "#F59E0B",
  completed: "#3B82F6",
  in_progress: "#3B82F6",
  cancelled: "#9CA3AF",
  no_show: "#EF4444",
};

function truncate(text: string, max = 16): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  ) {
    return "Aujourd'hui";
  }
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}

interface Props {
  appointments: AppointmentWithRelations[];
  flags: Map<string, AppointmentFlag>;
  onPress: (appt: AppointmentWithRelations) => void;
  compact?: boolean;
}

export function UpcomingStrip({ appointments, flags, onPress, compact }: Props) {
  if (appointments.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={compact ? styles.stripScrollCompact : undefined}
      contentContainerStyle={[styles.row, compact && styles.rowCompact]}>
      {appointments.map((appt) => {
        const flag = flags.get(appt.id);
        const name = clientDisplayName(appt.client.first_name, appt.client.last_name);
        const dot = STATUS_DOT[appt.status] ?? ownerColors.primary;

        return (
          <Pressable
            key={appt.id}
            style={[
              styles.card,
              compact && styles.cardCompact,
              flag === "test" && styles.cardTest,
              flag === "duplicate" && { borderColor: flagBorderColor("duplicate") },
              flag === "close_interval" && {
                borderColor: flagBorderColor("close_interval"),
              },
            ]}
            onPress={() => onPress(appt)}>
            {compact ? (
              <>
                <View style={styles.cardTopCompact}>
                  <Text style={styles.dateLabelCompact} numberOfLines={1}>
                    {dateLabel(appt.starts_at)}
                  </Text>
                  <View style={[styles.dotCompact, { backgroundColor: dot }]} />
                </View>
                <Text style={styles.timeCompact}>{formatTime(appt.starts_at)}</Text>
                <Text style={styles.nameCompact} numberOfLines={2}>
                  {truncate(name, 18)}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.cardTop}>
                  <Text style={styles.dateLabel}>{dateLabel(appt.starts_at)}</Text>
                  <View style={[styles.dot, { backgroundColor: dot }]} />
                </View>
                <Text style={styles.time}>{formatTime(appt.starts_at)}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {truncate(name)}
                </Text>
                <Text style={styles.service} numberOfLines={1}>
                  {truncate(appt.service.name)}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const COMPACT_STRIP_HEIGHT = 124;

const styles = StyleSheet.create({
  stripScrollCompact: {
    height: COMPACT_STRIP_HEIGHT,
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  rowCompact: {
    paddingTop: 2,
    paddingBottom: 2,
    gap: 8,
  },
  card: {
    width: 152,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    padding: 10,
  },
  cardCompact: {
    width: 120,
    height: 120,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    justifyContent: "space-between",
  },
  cardTest: {
    opacity: 0.5,
    backgroundColor: "#F3F4F6",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTopCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: ownerColors.textMuted,
    textTransform: "capitalize",
  },
  dateLabelCompact: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: ownerColors.textMuted,
    textTransform: "capitalize",
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotCompact: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  time: { fontSize: 15, fontWeight: "700", color: ownerColors.primary },
  timeCompact: {
    fontSize: 20,
    fontWeight: "700",
    color: ownerColors.primary,
    lineHeight: 22,
  },
  name: { fontSize: 13, fontWeight: "600", color: ownerColors.text, marginTop: 4 },
  nameCompact: {
    fontSize: 12,
    fontWeight: "600",
    color: ownerColors.text,
    lineHeight: 15,
  },
  service: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
});
