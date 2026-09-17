import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";

type Kpi = {
  key: string;
  value: string;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  warn?: boolean;
};

export function OwnerTodayKpis({ items }: { items: Kpi[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.key} style={styles.card}>
          <View style={[styles.icon, item.warn && styles.iconWarn]}>
            <Ionicons
              name={item.icon}
              size={20}
              color={item.warn ? "#D97706" : ownerColors.primary}
            />
          </View>
          <View style={styles.body}>
            <Text style={[styles.value, item.warn && styles.valueWarn]}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
            {item.hint ? <Text style={styles.hint}>{item.hint}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10, marginBottom: 16 },
  card: {
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: ownerColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWarn: { backgroundColor: "rgba(245, 158, 11, 0.12)" },
  body: { flex: 1, minWidth: 0 },
  value: {
    fontFamily: ownerFonts.bold,
    fontSize: 24,
    color: ownerColors.text,
    lineHeight: 28,
  },
  valueWarn: { color: "#D97706" },
  label: {
    fontFamily: ownerFonts.medium,
    fontSize: 14,
    color: ownerColors.text,
    marginTop: 2,
  },
  hint: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
});
