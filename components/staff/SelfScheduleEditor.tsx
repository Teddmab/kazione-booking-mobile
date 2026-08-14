import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { localeForLanguage } from "@/lib/format";
import type { StaffScheduleDay, StaffWorkingDay } from "@/services/staff/profile";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function weekdayShort(day: number, language: string): string {
  return new Date(2024, 0, 7 + day).toLocaleDateString(
    localeForLanguage(language),
    { weekday: "short" },
  );
}

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
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
        <Text style={styles.title}>{t("staffAccount.workingHours")}</Text>
        <Pressable
          style={[styles.saveBtn, busy && styles.saveDisabled]}
          disabled={busy}
          onPress={() => onSave(schedule)}>
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveText}>{t("common.save")}</Text>
          )}
        </Pressable>
      </View>
      <Text style={styles.hint}>{t("staffAccount.scheduleHint")}</Text>
      {schedule.map((row) => (
        <View key={row.day} style={styles.row}>
          <View style={styles.head}>
            <Text style={styles.dayName}>
              {weekdayShort(row.day, i18n.language)}
            </Text>
            <Switch
              value={row.is_working}
              onValueChange={(is_working) => updateDay(row.day, { is_working })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          {row.is_working ? (
            <View style={styles.times}>
              <TextInput
                style={styles.input}
                value={row.start_time ?? ""}
                onChangeText={(start_time) => updateDay(row.day, { start_time })}
                placeholder="09:00"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
              />
              <Text style={styles.sep}>–</Text>
              <TextInput
                style={styles.input}
                value={row.end_time ?? ""}
                onChangeText={(end_time) => updateDay(row.day, { end_time })}
                placeholder="18:00"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
              />
            </View>
          ) : (
            <Text style={styles.off}>{t("staffAccount.dayOff")}</Text>
          )}
        </View>
      ))}
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
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    saveBtn: {
      backgroundColor: colors.primary,
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
      color: colors.textDim,
      marginBottom: 12,
      fontFamily: ownerFonts.regular,
    },
    row: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      marginBottom: 8,
      backgroundColor: colors.card,
    },
    head: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dayName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    times: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.bg,
      fontFamily: ownerFonts.regular,
    },
    sep: { color: colors.textMuted },
    off: {
      marginTop: 8,
      fontSize: 13,
      color: colors.textDim,
      fontFamily: ownerFonts.regular,
    },
  });
}
