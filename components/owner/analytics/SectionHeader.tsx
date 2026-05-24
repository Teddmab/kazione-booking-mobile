import { Pressable, StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 10,
    gap: 12,
  },
  textCol: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: ownerColors.text },
  subtitle: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
  action: { fontSize: 14, fontWeight: "600", color: ownerColors.primary },
});
