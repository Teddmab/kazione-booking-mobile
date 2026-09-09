import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";

type Stage = "prepare" | "arrival" | "service" | "complete";

function stageForStatus(status: string): Stage {
  if (status === "completed" || status === "pending_completion") return "complete";
  if (status === "in_progress") return "service";
  if (status === "arrived") return "arrival";
  return "prepare";
}

type Props = {
  status: string;
  onMarkArrived: () => void;
  isMarkingArrived: boolean;
};

export function ArrivalStepper({
  status,
  onMarkArrived,
  isMarkingArrived,
}: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const stages: { key: Stage; label: string }[] = [
    { key: "prepare", label: t("staffToday.stagePrepare") },
    { key: "arrival", label: t("staffToday.stageArrival") },
    { key: "service", label: t("staffToday.stageService") },
    { key: "complete", label: t("staffToday.stageComplete") },
  ];
  const currentStage = stageForStatus(status);
  const currentIndex = stages.findIndex((s) => s.key === currentStage);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {stages.map((stage, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <View key={stage.key} style={styles.stageCol}>
              <View style={styles.stageInner}>
                <View
                  style={[
                    styles.dot,
                    done && styles.dotDone,
                    active && !done && styles.dotActive,
                  ]}>
                  {done ? (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.dotText,
                        active && styles.dotTextActive,
                      ]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.label,
                    active && styles.labelActive,
                  ]}>
                  {stage.label}
                </Text>
              </View>
              {i < stages.length - 1 ? (
                <View
                  style={[styles.line, done && styles.lineDone]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      {status === "confirmed" ? (
        <Pressable
          style={[styles.cta, isMarkingArrived && styles.ctaDisabled]}
          disabled={isMarkingArrived}
          onPress={onMarkArrived}>
          {isMarkingArrived ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>{t("staffToday.markArrived")}</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { gap: 12 },
    row: { flexDirection: "row", alignItems: "flex-start" },
    stageCol: { flex: 1, flexDirection: "row", alignItems: "flex-start" },
    stageInner: { alignItems: "center", gap: 4, zIndex: 1 },
    dot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    dotDone: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dotActive: { borderColor: colors.primary },
    dotText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textMuted,
      fontFamily: ownerFonts.bold,
    },
    dotTextActive: { color: colors.primary },
    label: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    labelActive: { color: colors.primary, fontFamily: ownerFonts.semiBold },
    line: {
      flex: 1,
      height: 2,
      backgroundColor: colors.border,
      marginTop: 13,
      marginHorizontal: 2,
    },
    lineDone: { backgroundColor: colors.primary },
    cta: {
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaDisabled: { opacity: 0.7 },
    ctaText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
    },
  });
}
