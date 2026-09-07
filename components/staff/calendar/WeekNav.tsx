import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { formatWeekLabel } from "@/lib/staffCalendar";

interface Props {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenPicker: () => void;
}

export function WeekNav({
  weekStart,
  onPrev,
  onNext,
  onToday,
  onOpenPicker,
}: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Pressable onPress={onPrev} style={styles.circleBtn} hitSlop={4}>
        <Ionicons name="chevron-back" size={18} color={colors.text} />
      </Pressable>

      <Pressable style={styles.rangePill} onPress={onOpenPicker}>
        <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
        <Text style={styles.rangeText}>{formatWeekLabel(weekStart)}</Text>
        <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
      </Pressable>

      <Pressable onPress={onNext} style={styles.circleBtn} hitSlop={4}>
        <Ionicons name="chevron-forward" size={18} color={colors.text} />
      </Pressable>

      <View style={{ flex: 1 }} />

      <Pressable onPress={onToday} style={styles.todayPill}>
        <Text style={styles.todayText}>{t("staffCalendar.todayBtn")}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 2,
    },
    circleBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    rangePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    rangeText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    todayPill: {
      borderWidth: 1,
      borderColor: colors.primary + "55",
      backgroundColor: colors.primarySurface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    todayText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: ownerFonts.bold,
    },
  });
}
