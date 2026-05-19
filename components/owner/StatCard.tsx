import { Text, View, StyleSheet } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

type Props = {
  label: string;
  value: string;
  hint?: string;
};

export function StatCard({ label, value, hint }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
  },
  label: {
    fontSize: 12,
    color: ownerColors.textDim,
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: ownerColors.text,
  },
  hint: {
    fontSize: 12,
    color: ownerColors.textMuted,
    marginTop: 4,
  },
});
