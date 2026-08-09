import { useMemo } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";

type Props = { status: string };

export function StatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const key = `staffStatus.${status}`;
  const label = t(key, { defaultValue: status });
  const variant =
    status === "confirmed"
      ? "confirmed"
      : status === "completed"
        ? "completed"
        : status === "cancelled" || status === "no_show"
          ? "cancelled"
          : status === "pending" ||
              status === "pending_payment" ||
              status === "pending_completion" ||
              status === "offered"
            ? "pending"
            : "neutral";

  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    confirmed: { backgroundColor: colors.successMuted },
    pending: { backgroundColor: colors.warningMuted },
    cancelled: { backgroundColor: colors.dangerMuted },
    completed: { backgroundColor: colors.primarySurface },
    neutral: { backgroundColor: colors.cardWarm },
    text: { fontSize: 12, fontWeight: "600" },
    confirmedText: { color: colors.success },
    pendingText: { color: colors.warning },
    cancelledText: { color: colors.danger },
    completedText: { color: colors.textMuted },
    neutralText: { color: colors.textMuted },
  });
}
