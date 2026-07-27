import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { formatWeekLabel } from "@/lib/staffCalendar";

interface Props {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function WeekNav({ weekStart, onPrev, onNext, onToday }: Props) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onPrev} style={styles.btn} hitSlop={6}>
        <Ionicons name="chevron-back" size={20} color={ownerColors.primary} />
      </Pressable>
      <Pressable onPress={onToday} style={styles.todayBtn}>
        <Text style={styles.todayText}>{"Aujourd'hui"}</Text>
      </Pressable>
      <Pressable onPress={onNext} style={styles.btn} hitSlop={6}>
        <Ionicons name="chevron-forward" size={20} color={ownerColors.primary} />
      </Pressable>
      <Text style={styles.label}>{formatWeekLabel(weekStart)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  todayBtn: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.primarySurface,
    justifyContent: "center",
  },
  todayText: {
    fontSize: 13,
    color: ownerColors.primary,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  label: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: ownerColors.text,
    flexShrink: 1,
    fontFamily: ownerFonts.semiBold,
  },
});
