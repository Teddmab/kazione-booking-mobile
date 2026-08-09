import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import type { StaffWorkingDay } from "@/services/staff/profile";

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

interface Props {
  workingHours: StaffWorkingDay[];
}

export function WorkingHoursCard({ workingHours }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const ordered = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Horaires de travail</Text>
      <Text style={styles.hint}>
        Gérés par le propriétaire — contactez-le pour toute modification.
      </Text>
      {ordered.map((dayIdx) => {
        const entry = workingHours.find((d) => d.day === dayIdx);
        const isWorking = entry?.is_working ?? false;
        const label = isWorking
          ? `${entry?.start_time ?? "?"} – ${entry?.end_time ?? "?"}`
          : "Repos";
        return (
          <View key={dayIdx} style={styles.row}>
            <Text style={styles.dayName}>{DAY_NAMES[dayIdx]}</Text>
            <Text style={[styles.hours, !isWorking && styles.off]}>{label}</Text>
          </View>
        );
      })}
      {workingHours.length === 0 ? (
        <Text style={styles.empty}>Horaires non disponibles pour le moment.</Text>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.primarySurface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    title: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
      fontFamily: ownerFonts.bold,
    },
    hint: {
      fontSize: 12,
      color: colors.textDim,
      marginBottom: 12,
      fontFamily: ownerFonts.regular,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    dayName: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
      fontFamily: ownerFonts.medium,
    },
    hours: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    off: { color: colors.textDim },
    empty: {
      fontSize: 13,
      color: colors.textDim,
      marginTop: 8,
      fontFamily: ownerFonts.regular,
    },
  });
}
