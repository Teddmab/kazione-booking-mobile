import { StyleSheet, Text, View } from "react-native";

import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";
import type { StaffWorkingDay } from "@/services/staff/profile";

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

interface Props {
  workingHours: StaffWorkingDay[];
}

export function WorkingHoursCard({ workingHours }: Props) {
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

const styles = StyleSheet.create({
  card: {
    ...ownerStyles.card,
    backgroundColor: ownerColors.primarySurface,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: ownerColors.text,
    marginBottom: 4,
    fontFamily: ownerFonts.bold,
  },
  hint: {
    fontSize: 12,
    color: ownerColors.textDim,
    marginBottom: 12,
    fontFamily: ownerFonts.regular,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ownerColors.border,
  },
  dayName: {
    fontSize: 14,
    fontWeight: "500",
    color: ownerColors.text,
    fontFamily: ownerFonts.medium,
  },
  hours: {
    fontSize: 14,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.regular,
  },
  off: { color: ownerColors.textDim },
  empty: {
    fontSize: 13,
    color: ownerColors.textDim,
    marginTop: 8,
    fontFamily: ownerFonts.regular,
  },
});
