import { Ionicons } from "@expo/vector-icons";
import { Text, View, StyleSheet } from "react-native";
import type { ComponentProps } from "react";

import { ownerColors } from "@/constants/ownerTheme";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  label: string;
  value: string;
  hint?: string;
  hintSuccess?: boolean;
  icon: IconName;
};

export function DashboardStatCard({ label, value, hint, hintSuccess, icon }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={ownerColors.primary} />
        </View>
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {hint ? (
        <Text style={[styles.hint, hintSuccess && styles.hintSuccess]} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: ownerColors.textMuted,
    lineHeight: 18,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ownerColors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    color: ownerColors.text,
    marginBottom: 4,
  },
  hint: { fontSize: 12, color: ownerColors.textDim },
  hintSuccess: { color: ownerColors.success, fontWeight: "500" },
});
