import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { addDays, toIsoDateLocal } from "@/lib/staffCalendar";
import { localeForLanguage } from "@/lib/format";

interface Props {
  weekStart: Date;
  selectedDate: string;
  countsByDate: Record<string, number>;
  onSelect: (date: string) => void;
}

export function BookingDayStrip({
  weekStart,
  selectedDate,
  countsByDate,
  onSelect,
}: Props) {
  const { i18n } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = localeForLanguage(i18n.language);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      const date = toIsoDateLocal(d);
      return {
        date,
        weekday: d
          .toLocaleDateString(locale, { weekday: "short" })
          .replace(".", "")
          .toUpperCase(),
        dayNum: String(d.getDate()),
        count: countsByDate[date] ?? 0,
      };
    });
  }, [weekStart, countsByDate, locale]);

  return (
    <View style={styles.row}>
      {days.map((day) => {
        const active = day.date === selectedDate;
        return (
          <Pressable
            key={day.date}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(day.date)}>
            <Text style={[styles.weekday, active && styles.textActive]} numberOfLines={1}>
              {day.weekday}
            </Text>
            <Text style={[styles.dayNum, active && styles.textActive]}>
              {day.dayNum}
            </Text>
            <Text style={[styles.count, active && styles.textActive]}>
              {day.count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 16,
    },
    chip: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 2,
      gap: 1,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    weekday: {
      fontSize: 9,
      fontWeight: "700",
      color: colors.textMuted,
      letterSpacing: 0.2,
      fontFamily: ownerFonts.bold,
    },
    dayNum: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    count: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textDim,
      fontFamily: ownerFonts.semiBold,
    },
    textActive: { color: "#fff" },
  });
}
