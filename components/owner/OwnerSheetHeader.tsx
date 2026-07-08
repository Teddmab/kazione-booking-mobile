import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

interface Props {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function OwnerSheetHeader({
  title,
  onClose,
  closeLabel = "Fermer",
  disabled,
  style,
}: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Pressable
        onPress={onClose}
        disabled={disabled}
        style={[styles.closeBtn, disabled && styles.closeBtnDisabled]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}>
        <Ionicons name="close" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: ownerColors.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ownerColors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ownerColors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  closeBtnDisabled: { opacity: 0.45 },
});
