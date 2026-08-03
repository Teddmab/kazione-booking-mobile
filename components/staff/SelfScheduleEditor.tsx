import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";
import type { StaffScheduleDay, StaffWorkingDay } from "@/services/staff/profile";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function normalizeSchedule(workingHours: StaffWorkingDay[]): StaffScheduleDay[] {
  return DAY_ORDER.map((day) => {
    const entry = workingHours.find((d) => d.day === day);
    return {
      day,
      is_working: entry?.is_working ?? false,
      start_time: entry?.start_time ?? "09:00",
      end_time: entry?.end_time ?? "18:00",
    };
  });
}

interface Props {
  workingHours: StaffWorkingDay[];
  onSave: (schedule: StaffScheduleDay[]) => void;
  busy?: boolean;
}

export function SelfScheduleEditor({ workingHours, onSave, busy }: Props) {
  const [schedule, setSchedule] = useState(() => normalizeSchedule(workingHours));

  useEffect(() => {
    setSchedule(normalizeSchedule(workingHours));
  }, [workingHours]);

  const updateDay = (day: number, patch: Partial<StaffScheduleDay>) => {
    setSchedule((prev) =>
      prev.map((row) => (row.day === day ? { ...row, ...patch } : row)),
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Horaires de travail</Text>
        <Pressable
          style={[styles.saveBtn, busy && styles.saveDisabled]}
          disabled={busy}
          onPress={() => onSave(schedule)}>
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveText}>Enregistrer</Text>
          )}
        </Pressable>
      </View>
      <Text style={styles.hint}>
        Ces horaires alimentent votre agenda. Format 24h : HH:MM
      </Text>
      {schedule.map((row) => (
        <View key={row.day} style={styles.row}>
          <View style={styles.head}>
            <Text style={styles.dayName}>{DAY_NAMES[row.day]}</Text>
            <Switch
              value={row.is_working}
              onValueChange={(is_working) => updateDay(row.day, { is_working })}
              trackColor={{ true: ownerColors.primary, false: ownerColors.border }}
            />
          </View>
          {row.is_working ? (
            <View style={styles.times}>
              <TextInput
                style={styles.input}
                value={row.start_time ?? ""}
                onChangeText={(start_time) => updateDay(row.day, { start_time })}
                placeholder="09:00"
                placeholderTextColor={ownerColors.textDim}
                autoCapitalize="none"
              />
              <Text style={styles.sep}>–</Text>
              <TextInput
                style={styles.input}
                value={row.end_time ?? ""}
                onChangeText={(end_time) => updateDay(row.day, { end_time })}
                placeholder="18:00"
                placeholderTextColor={ownerColors.textDim}
                autoCapitalize="none"
              />
            </View>
          ) : (
            <Text style={styles.off}>Repos</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...ownerStyles.card,
    backgroundColor: ownerColors.primarySurface,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  saveBtn: {
    backgroundColor: ownerColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 96,
    alignItems: "center",
  },
  saveDisabled: { opacity: 0.7 },
  saveText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  hint: {
    fontSize: 12,
    color: ownerColors.textDim,
    marginBottom: 12,
    fontFamily: ownerFonts.regular,
  },
  row: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: ownerColors.card,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayName: {
    fontSize: 14,
    fontWeight: "600",
    color: ownerColors.text,
    fontFamily: ownerFonts.semiBold,
  },
  times: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: ownerColors.text,
    backgroundColor: ownerColors.bg,
    fontFamily: ownerFonts.regular,
  },
  sep: { color: ownerColors.textMuted },
  off: {
    marginTop: 8,
    fontSize: 13,
    color: ownerColors.textDim,
    fontFamily: ownerFonts.regular,
  },
});
