import { Ionicons } from "@expo/vector-icons";
import { Text, View, StyleSheet } from "react-native";
import type { ComponentProps } from "react";

import { ownerColors } from "@/constants/ownerTheme";

type IconName = ComponentProps<typeof Ionicons>["name"];

export interface CompactStatItem {
  label: string;
  value: string;
  icon?: IconName;
}

interface Props {
  items: CompactStatItem[];
}

/** Compact horizontal stats strip — less vertical space than DashboardStatCard grid. */
export function CompactStatStrip({ items }: Props) {
  return (
    <View style={styles.strip}>
      {items.map((item, index) => (
        <View key={item.label} style={styles.itemWrap}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.item}>
            {item.icon ? (
              <Ionicons name={item.icon} size={14} color={ownerColors.primary} style={styles.icon} />
            ) : null}
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "stretch",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    overflow: "hidden",
  },
  itemWrap: { flex: 1, flexDirection: "row", alignItems: "stretch" },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 1,
  },
  divider: {
    width: 1,
    backgroundColor: ownerColors.border,
    marginVertical: 8,
  },
  icon: { marginBottom: 2 },
  value: { fontSize: 16, fontWeight: "700", color: ownerColors.text },
  label: {
    fontSize: 10,
    color: ownerColors.textMuted,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
