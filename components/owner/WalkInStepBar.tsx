import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

interface Props {
  currentStep: number;
  labels: string[];
}

export function WalkInStepBar({ currentStep, labels }: Props) {
  const { t } = useTranslation();
  const total = labels.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {labels.map((label, index) => {
          const stepNum = index + 1;
          const completed = index < currentStep;
          const active = index === currentStep;
          return (
            <View key={label} style={styles.stepWrap}>
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.circle,
                    completed && styles.circleCompleted,
                    active && styles.circleActive,
                  ]}>
                  {completed ? (
                    <Ionicons name="checkmark" size={14} color={ownerColors.primary} />
                  ) : (
                    <Text style={[styles.num, active && styles.numActive]}>{stepNum}</Text>
                  )}
                </View>
                <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
              {index < total - 1 ? (
                <View style={[styles.line, completed && styles.lineCompleted]} />
              ) : null}
            </View>
          );
        })}
      </View>
      <Text style={styles.caption}>
        {t("owner.walkInStepOf", { current: currentStep + 1, total })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center" },
  stepWrap: { flexDirection: "row", alignItems: "flex-start", flex: 1, maxWidth: 72 },
  stepCol: { alignItems: "center", flex: 1 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ownerColors.card,
  },
  circleActive: {
    backgroundColor: ownerColors.primary,
    borderColor: ownerColors.primary,
  },
  circleCompleted: {
    borderColor: ownerColors.primary,
    backgroundColor: ownerColors.primaryMuted,
  },
  num: { fontSize: 12, fontWeight: "700", color: ownerColors.textMuted },
  numActive: { color: "#fff" },
  label: {
    fontSize: 9,
    color: ownerColors.textDim,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
  },
  labelActive: { color: ownerColors.primary, fontWeight: "700" },
  line: {
    width: 12,
    height: 2,
    backgroundColor: ownerColors.border,
    marginTop: 13,
    marginHorizontal: 2,
  },
  lineCompleted: { backgroundColor: ownerColors.primary },
  caption: {
    fontSize: 12,
    color: ownerColors.textMuted,
    textAlign: "center",
    marginTop: 10,
  },
});
