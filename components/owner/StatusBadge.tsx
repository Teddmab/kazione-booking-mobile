import { useMemo } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useLiveNow } from "@/hooks/useLiveNow";
import {
  displayStatusI18nKey,
  resolveAppointmentDisplayStatus,
  type AppointmentDisplayStatus,
} from "@/lib/appointmentDisplayStatus";

type Props = {
  status: string;
  startsAt?: string;
  endsAt?: string;
  /** When false, skip live clock (sheet already remounts on open). Default true. */
  live?: boolean;
};

const VARIANT: Record<
  AppointmentDisplayStatus,
  "confirmed" | "pending" | "cancelled" | "completed" | "late" | "progress" | "arrived" | "neutral"
> = {
  confirmed: "confirmed",
  arrived: "arrived",
  in_progress: "progress",
  completed: "completed",
  pending_completion: "pending",
  cancelled: "cancelled",
  no_show: "cancelled",
  pending: "pending",
  offered: "pending",
  late: "late",
  conflict: "late",
  other: "neutral",
};

export function StatusBadge({
  status,
  startsAt,
  endsAt,
  live = true,
}: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const now = useLiveNow(live ? 15_000 : 60_000 * 60);

  const display = useMemo(() => {
    if (startsAt && endsAt) {
      return resolveAppointmentDisplayStatus(
        { status, starts_at: startsAt, ends_at: endsAt },
        live ? now : new Date(),
      );
    }
    return resolveAppointmentDisplayStatus(
      {
        status,
        starts_at: new Date(0).toISOString(),
        ends_at: new Date(0).toISOString(),
      },
      live ? now : new Date(),
    );
  }, [status, startsAt, endsAt, now, live]);

  const variant = VARIANT[display] ?? "neutral";
  const label = t(displayStatusI18nKey(display), { defaultValue: status });

  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    confirmed: { backgroundColor: colors.successMuted },
    pending: { backgroundColor: colors.warningMuted },
    cancelled: { backgroundColor: colors.dangerMuted },
    completed: { backgroundColor: colors.primarySurface },
    late: { backgroundColor: colors.dangerMuted },
    progress: { backgroundColor: "#EDE9FE" },
    arrived: { backgroundColor: "#CFFAFE" },
    neutral: { backgroundColor: colors.cardWarm },
    text: { fontSize: 12, fontWeight: "600" },
    confirmedText: { color: colors.success },
    pendingText: { color: colors.warning },
    cancelledText: { color: colors.danger },
    completedText: { color: colors.textMuted },
    lateText: { color: colors.danger },
    progressText: { color: "#6D28D9" },
    arrivedText: { color: "#0E7490" },
    neutralText: { color: colors.textMuted },
  });
}
