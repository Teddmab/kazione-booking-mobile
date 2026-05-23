import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { useOwnerShell } from "@/contexts/OwnerShellContext";
import { ownerColors } from "@/constants/ownerTheme";

export function OwnerMenuHeaderButton() {
  const { toggleDrawer } = useOwnerShell();

  return (
    <Pressable style={styles.btn} onPress={toggleDrawer} accessibilityLabel="Menu">
      <Ionicons name="menu" size={22} color={ownerColors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { marginLeft: 8, padding: 8 },
});
