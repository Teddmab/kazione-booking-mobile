import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "@/components/owner/StatusBadge";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { clientDisplayName, formatCurrency, formatTime } from "@/lib/format";
import type { StaffAppointment } from "@/services/staff/appointments";

interface Props {
  appointment: StaffAppointment;
  onPress: (appointment: StaffAppointment) => void;
}

export function TodayAppointmentCard({ appointment, onPress }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const stripMap: Record<string, string> = {
    offered: "#6366F1",
    pending: colors.warning,
    confirmed: colors.primary,
    in_progress: colors.primaryLight,
    pending_completion: "#D97706",
    completed: colors.success,
    no_show: colors.danger,
    cancelled: colors.textDim,
  };
  const strip = stripMap[appointment.status] ?? stripMap.pending;
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
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {duration} min · {formatCurrency(price)}
          </Text>
          {appointment.referral_staff_id ? (
            <Text style={styles.referral}>{t("staffToday.viaReferral")}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.textMuted,
      fontFamily: ownerFonts.semiBold,
    },
    client: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    service: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
      gap: 8,
    },
    meta: {
      fontSize: 12,
      color: colors.textDim,
      fontFamily: ownerFonts.regular,
    },
    referral: {
      fontSize: 11,
      fontWeight: "600",
      color: "#818CF8",
      fontFamily: ownerFonts.semiBold,
    },
  });
}
