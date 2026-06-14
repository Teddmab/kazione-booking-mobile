import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

interface Props {
  label: string;
  value: string;
  onPress: () => void;
  hint?: string;
}

export function SettingsPickerRow({ label, value, onPress, hint }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <Pressable style={styles.row} onPress={onPress}>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-down" size={18} color={ownerColors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  label: { fontSize: 12, color: ownerColors.textDim },
  hint: { fontSize: 11, color: ownerColors.textMuted, marginTop: 2, lineHeight: 16 },
  row: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: ownerColors.bg,
    gap: 8,
  },
  value: { flex: 1, fontSize: 15, color: ownerColors.text },
});
