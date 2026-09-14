import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useTenantContext } from "@/contexts/TenantContext";
import {
  displayStatusI18nKey,
  resolveAppointmentDisplayStatus,
  type AppointmentDisplayStatus,
} from "@/lib/appointmentDisplayStatus";
import { formatTime } from "@/lib/format";
import type { StaffAppointment } from "@/services/staff/appointments";

export type BookingVisualStatus = AppointmentDisplayStatus;

/** @deprecated use resolveAppointmentDisplayStatus — kept for call sites */
export function resolveVisualStatus(
  appt: StaffAppointment,
  now = new Date(),
  isConflict = false,
): BookingVisualStatus {
  return resolveAppointmentDisplayStatus(appt, now, isConflict);
}

type CardPalette = {
  bar: string;
  badgeBg: string;
  badgeFg: string;
  time: string;
  cardBg: string;
};

/** Status-only palettes — display is independent of position / page reload. */
const STATUS_COLORS: Record<AppointmentDisplayStatus, CardPalette> = {
  confirmed: {
    bar: "#059669",
    badgeBg: "#D1FAE5",
    badgeFg: "#047857",
    time: "#059669",
    cardBg: "#ECFDF5",
  },
  in_progress: {
    bar: "#7C3AED",
    badgeBg: "#EDE9FE",
    badgeFg: "#6D28D9",
    time: "#7C3AED",
    cardBg: "#F5F3FF",
  },
  pending: {
    bar: "#D97706",
    badgeBg: "#FEF3C7",
    badgeFg: "#B45309",
    time: "#D97706",
    cardBg: "#FFF8E7",
  },
  offered: {
    bar: "#D97706",
    badgeBg: "#FEF3C7",
    badgeFg: "#B45309",
    time: "#D97706",
    cardBg: "#FFF8E7",
  },
  late: {
    bar: "#DC2626",
    badgeBg: "#FEE2E2",
    badgeFg: "#B91C1C",
    time: "#DC2626",
    cardBg: "#FEF2F2",
  },
  arrived: {
    bar: "#0891B2",
    badgeBg: "#CFFAFE",
    badgeFg: "#0E7490",
    time: "#0891B2",
    cardBg: "#ECFEFF",
  },
  completed: {
    bar: "#94A3B8",
    badgeBg: "#F1F5F9",
    badgeFg: "#64748B",
    time: "#64748B",
    cardBg: "#F8FAFC",
  },
  pending_completion: {
    bar: "#D97706",
    badgeBg: "#FEF3C7",
    badgeFg: "#B45309",
    time: "#D97706",
    cardBg: "#FFF8E7",
  },
  cancelled: {
    bar: "#94A3B8",
    badgeBg: "#F1F5F9",
    badgeFg: "#64748B",
    time: "#64748B",
    cardBg: "#F8FAFC",
  },
  no_show: {
    bar: "#DC2626",
    badgeBg: "#FEE2E2",
    badgeFg: "#B91C1C",
    time: "#DC2626",
    cardBg: "#FEF2F2",
  },
  conflict: {
    bar: "#DC2626",
    badgeBg: "#FEE2E2",
    badgeFg: "#991B1B",
    time: "#B91C1C",
    cardBg: "#FEF2F2",
  },
  other: {
    bar: "#6366F1",
    badgeBg: "#E0E7FF",
    badgeFg: "#4338CA",
    time: "#4F46E5",
    cardBg: "#EEF2FF",
  },
};

export function paletteForBooking(
  visualStatus: BookingVisualStatus,
): CardPalette {
  return STATUS_COLORS[visualStatus] ?? STATUS_COLORS.other;
}

interface Props {
  appointment: StaffAppointment;
  visualStatus: BookingVisualStatus;
  onPress: () => void;
  onResolveConflict?: () => void;
}

export function BookingApptCard({
  appointment,
  visualStatus,
  onPress,
  onResolveConflict,
}: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { tenant } = useTenantContext();
  const timeZone = tenant?.timezone ?? "Europe/Tallinn";
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const palette = paletteForBooking(visualStatus);
  const isConflict = visualStatus === "conflict";

  const statusLabel = t(displayStatusI18nKey(visualStatus), {
    defaultValue: visualStatus,
  });

  const timeRange = `${formatTime(appointment.starts_at, "en", timeZone)} – ${formatTime(appointment.ends_at, "en", timeZone)}`;
  const client = `${appointment.client.first_name} ${appointment.client.last_name}`.trim();

  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: palette.cardBg },
        isConflict && styles.cardConflict,
      ]}
      onPress={onPress}>
      <View style={[styles.bar, { backgroundColor: palette.bar }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.time, { color: palette.time }]}>{timeRange}</Text>
          <View style={[styles.badge, { backgroundColor: palette.badgeBg }]}>
            <Text style={[styles.badgeText, { color: palette.badgeFg }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
        {isConflict ? (
          <>
            <Text style={styles.client}>{t("staffCalendar.conflictTitle")}</Text>
            <Text style={styles.service}>{t("staffCalendar.conflictSub")}</Text>
            {onResolveConflict ? (
              <Pressable style={styles.resolveBtn} onPress={onResolveConflict}>
                <Text style={styles.resolveText}>
                  {t("staffCalendar.resolve")}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.client} numberOfLines={1}>
              {client}
            </Text>
            <View style={styles.bottomRow}>
              <Text style={styles.service} numberOfLines={1}>
                {appointment.service.name}
              </Text>
              <Text style={styles.duration}>
                {appointment.service.duration_minutes} min
              </Text>
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
}

export function BlockSlotCard({
  startLabel,
  endLabel,
  onPress,
}: {
  startLabel: string;
  endLabel: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable style={styles.blockCard} onPress={onPress}>
      <Ionicons name="add" size={14} color={colors.warning} />
      <Text style={styles.blockTitle} numberOfLines={1}>
        {t("staffCalendar.blockSlot")}
      </Text>
      <Text style={styles.blockMeta}>
        {startLabel}–{endLabel}
      </Text>
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      minHeight: 64,
    },
    cardConflict: {
      borderColor: "#FECACA",
    },
    bar: { width: 4 },
    body: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 2,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    time: {
      fontSize: 11,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
    },
    client: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    bottomRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    service: {
      flex: 1,
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    duration: {
      fontSize: 11,
      color: colors.textDim,
      fontFamily: ownerFonts.medium,
    },
    resolveBtn: {
      alignSelf: "flex-end",
      marginTop: 2,
      backgroundColor: colors.danger,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    resolveText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
    },
    blockCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    blockTitle: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
      color: colors.textMuted,
      fontFamily: ownerFonts.semiBold,
    },
    blockMeta: {
      fontSize: 10,
      color: colors.textDim,
      fontFamily: ownerFonts.regular,
    },
  });
}
