import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { localeForLanguage } from "@/lib/format";
import {
  addDays,
  startOfWeekMonday,
  toIsoDateLocal,
} from "@/lib/staffCalendar";

interface Props {
  visible: boolean;
  weekStart: Date;
  selectedDate: string;
  onClose: () => void;
  onSelectDate: (isoDate: string) => void;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function WeekPickerModal({
  visible,
  weekStart,
  selectedDate,
  onClose,
  onSelectDate,
}: Props) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = localeForLanguage(i18n.language);
  const [cursor, setCursor] = useState(() => startOfMonth(weekStart));

  const monthLabel = cursor.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const gridStart = startOfWeekMonday(first);
    return Array.from({ length: 42 }, (_, i) => {
      const d = addDays(gridStart, i);
      const iso = toIsoDateLocal(d);
      return {
        iso,
        day: d.getDate(),
        inMonth: d.getMonth() === cursor.getMonth(),
        isSelected: iso === selectedDate,
        isToday: iso === toIsoDateLocal(new Date()),
      };
    });
  }, [cursor, selectedDate]);

  const weekdays = useMemo(() => {
    const mon = startOfWeekMonday(new Date());
    return Array.from({ length: 7 }, (_, i) =>
      addDays(mon, i)
        .toLocaleDateString(locale, { weekday: "short" })
        .replace(".", "")
        .slice(0, 2)
        .toUpperCase(),
    );
  }, [locale]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.head}>
          <Text style={styles.title}>{t("staffCalendar.pickWeek")}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.monthNav}>
          <Pressable
            style={styles.circleBtn}
            onPress={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }>
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable
            style={styles.circleBtn}
            onPress={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.weekdays}>
          {weekdays.map((w) => (
            <Text key={w} style={styles.weekday}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((cell) => (
            <Pressable
              key={cell.iso}
              style={[
                styles.dayCell,
                cell.isSelected && styles.dayCellSelected,
                cell.isToday && !cell.isSelected && styles.dayCellToday,
              ]}
              onPress={() => {
                onSelectDate(cell.iso);
                onClose();
              }}>
              <Text
                style={[
                  styles.dayNum,
                  !cell.inMonth && styles.dayNumMuted,
                  cell.isSelected && styles.dayNumSelected,
                ]}>
                {cell.day}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.hint}>{t("staffCalendar.pickWeekHint")}</Text>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheet: {
      marginTop: "auto",
      backgroundColor: colors.card,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 16,
      gap: 12,
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    monthNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    circleBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    monthLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      textTransform: "capitalize",
      fontFamily: ownerFonts.bold,
    },
    weekdays: {
      flexDirection: "row",
    },
    weekday: {
      width: `${100 / 7}%`,
      textAlign: "center",
      fontSize: 11,
      fontWeight: "700",
      color: colors.textMuted,
      fontFamily: ownerFonts.bold,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
    },
    dayCellSelected: {
      backgroundColor: colors.primary,
    },
    dayCellToday: {
      borderWidth: 1,
      borderColor: colors.primary,
    },
    dayNum: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    dayNumMuted: { color: colors.textDim },
    dayNumSelected: { color: "#fff" },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
      fontFamily: ownerFonts.regular,
    },
  });
}
