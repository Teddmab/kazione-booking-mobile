import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { localeForLanguage } from "@/lib/format";
import type { StaffScheduleDay, StaffWorkingDay } from "@/services/staff/profile";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function weekdayLabel(day: number, language: string): string {
  return new Date(2024, 0, 7 + day).toLocaleDateString(
    localeForLanguage(language),
    { weekday: "long" },
  );
}

function toHm(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return value.slice(0, 5);
}

function normalizeSchedule(workingHours: StaffWorkingDay[]): StaffScheduleDay[] {
  return DAY_ORDER.map((day) => {
    const entry = workingHours.find((d) => d.day === day);
    return {
      day,
      is_working: entry?.is_working ?? false,
      start_time: toHm(entry?.start_time, "09:00"),
      end_time: toHm(entry?.end_time, "18:00"),
    };
  });
}

interface Props {
  visible: boolean;
  workingHours: StaffWorkingDay[];
  busy?: boolean;
  onClose: () => void;
  onSave: (schedule: StaffScheduleDay[]) => void;
}

export function StaffAvailabilitySheet({
  visible,
  workingHours,
  busy,
  onClose,
  onSave,
}: Props) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetHeight = Math.round(height * 0.88);
  const [schedule, setSchedule] = useState(() =>
    normalizeSchedule(workingHours),
  );

  useEffect(() => {
    if (visible) setSchedule(normalizeSchedule(workingHours));
  }, [visible, workingHours]);

  const updateDay = (day: number, patch: Partial<StaffScheduleDay>) => {
    setSchedule((prev) =>
      prev.map((row) => (row.day === day ? { ...row, ...patch } : row)),
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            {t("staffServices.manageAvailability")}
          </Text>
          <Text style={styles.subtitle}>{t("staffAccount.weeklyDesc")}</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            {schedule.map((row) => (
              <View
                key={row.day}
                style={[styles.dayRow, !row.is_working && styles.dayRowOff]}>
                <View style={styles.dayHead}>
                  <Text style={styles.dayName} numberOfLines={1}>
                    {weekdayLabel(row.day, i18n.language)}
                  </Text>
                  <Switch
                    value={row.is_working}
                    onValueChange={(is_working) =>
                      updateDay(row.day, { is_working })
                    }
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor="#fff"
                  />
                </View>
                {row.is_working ? (
                  <View style={styles.times}>
                    <View style={styles.timeField}>
                      <Text style={styles.timeLabel}>
                        {t("staffAccount.labelStart")}
                      </Text>
                      <TextInput
                        style={styles.timeInput}
                        value={row.start_time ?? ""}
                        onChangeText={(start_time) =>
                          updateDay(row.day, { start_time })
                        }
                        placeholder="09:00"
                        placeholderTextColor={colors.textDim}
                        autoCapitalize="none"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <Text style={styles.sep}>–</Text>
                    <View style={styles.timeField}>
                      <Text style={styles.timeLabel}>
                        {t("staffAccount.labelEnd")}
                      </Text>
                      <TextInput
                        style={styles.timeInput}
                        value={row.end_time ?? ""}
                        onChangeText={(end_time) =>
                          updateDay(row.day, { end_time })
                        }
                        placeholder="18:00"
                        placeholderTextColor={colors.textDim}
                        autoCapitalize="none"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </View>
                ) : (
                  <Text style={styles.off}>{t("staffAccount.dayOff")}</Text>
                )}
              </View>
            ))}
          </ScrollView>

          <Pressable
            style={[styles.saveBtn, busy && styles.saveDisabled]}
            disabled={busy}
            onPress={() => onSave(schedule)}>
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveText}>
                {t("staffAccount.saveSchedule")}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(26,15,10,0.4)",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 14,
    },
    title: {
      fontSize: 18,
      fontFamily: ownerFonts.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
      marginTop: 4,
      marginBottom: 12,
    },
    scroll: {
      flex: 1,
    },
    list: {
      gap: 8,
      paddingBottom: 8,
    },
    dayRow: {
      backgroundColor: colors.bg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    dayRowOff: {
      opacity: 0.78,
    },
    dayHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    dayName: {
      flex: 1,
      fontSize: 15,
      fontFamily: ownerFonts.semiBold,
      color: colors.text,
      textTransform: "capitalize",
    },
    times: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      marginTop: 10,
    },
    timeField: {
      flex: 1,
      gap: 4,
    },
    timeLabel: {
      fontSize: 11,
      color: colors.textDim,
      fontFamily: ownerFonts.medium,
    },
    timeInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      fontFamily: ownerFonts.semiBold,
      color: colors.text,
      backgroundColor: colors.card,
    },
    sep: {
      fontSize: 16,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
      paddingBottom: 10,
    },
    off: {
      marginTop: 8,
      fontSize: 13,
      color: colors.textDim,
      fontFamily: ownerFonts.regular,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 10,
    },
    saveDisabled: { opacity: 0.7 },
    saveText: {
      color: "#fff",
      fontSize: 15,
      fontFamily: ownerFonts.semiBold,
    },
  });
}
