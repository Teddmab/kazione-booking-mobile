import { Pressable, Text, StyleSheet } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

export function OwnerAddHeaderButton({
  onPress,
  compact,
}: {
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, compact && styles.btnCompact]}
      accessibilityLabel="Ajouter"
      hitSlop={8}>
      <Text style={[styles.plus, compact && styles.plusCompact]}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { marginRight: 4, padding: 4 },
  btnCompact: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  plus: { fontSize: 28, color: ownerColors.primary, fontWeight: "300", lineHeight: 30 },
  plusCompact: { fontSize: 22, lineHeight: 24 },
});
