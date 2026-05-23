import { Switch, StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

type Props = {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
};

export function SwitchRow({ label, subtitle, value, onValueChange, disabled }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: ownerColors.border, true: ownerColors.primaryMuted }}
        thumbColor={value ? ownerColors.primary : "#f4f3f4"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 12,
  },
  textBlock: { flex: 1 },
  label: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  subtitle: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
});
