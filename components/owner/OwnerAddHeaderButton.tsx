import { Pressable, Text, StyleSheet } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

export function OwnerAddHeaderButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.btn}
      accessibilityLabel="Ajouter"
      hitSlop={8}>
      <Text style={styles.plus}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { marginRight: 12, padding: 4 },
  plus: { fontSize: 28, color: ownerColors.primary, fontWeight: "300", lineHeight: 30 },
});
