import { Ionicons } from "@expo/vector-icons";
import { Text, View, StyleSheet } from "react-native";
import type { ComponentProps } from "react";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type DashboardKpiItem = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  hintSuccess?: boolean;
  icon: IconName;
};

interface Props {
  title: string;
  items: DashboardKpiItem[];
}

function KpiCell({
  item,
  variant,
}: {
  item: DashboardKpiItem;
  variant: "hero" | "compact";
}) {
  const isHero = variant === "hero";

  return (
    <View style={[styles.cell, isHero ? styles.cellHero : styles.cellCompact]}>
      <View style={[styles.iconWrap, isHero && styles.iconWrapHero]}>
        <Ionicons name={item.icon} size={isHero ? 18 : 16} color={ownerColors.primary} />
      </View>
      <View style={styles.cellBody}>
        <Text style={[styles.label, isHero && styles.labelHero]} numberOfLines={2}>
          {item.label}
        </Text>
        <Text
          style={[styles.value, isHero && styles.valueHero]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}>
          {item.value}
        </Text>
        {item.hint ? (
          <Text
            style={[styles.hint, item.hintSuccess && styles.hintSuccess]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {item.hint}
          </Text>
        ) : (
          <View style={styles.hintPlaceholder} />
        )}
      </View>
    </View>
  );
}

/** Unified owner dashboard KPI block — one card, no scattered squares. */
export function DashboardKpiPanel({ title, items }: Props) {
  const hero = items.slice(0, 2);
  const rest = items.slice(2);
  const rows: DashboardKpiItem[][] = [];

  for (let i = 0; i < rest.length; i += 2) {
    rows.push(rest.slice(i, i + 2));
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>

      <View style={styles.heroRow}>
        {hero.map((item, index) => (
          <View key={item.key} style={[styles.heroSlot, index === 0 && styles.heroSlotLeft]}>
            <KpiCell item={item} variant="hero" />
          </View>
        ))}
      </View>

      {rows.map((pair, rowIndex) => (
        <View
          key={pair.map((p) => p.key).join("-")}
          style={[styles.dataRow, rowIndex < rows.length - 1 && styles.dataRowBorder]}>
          {pair.map((item, colIndex) => (
            <View
              key={item.key}
              style={[styles.dataSlot, colIndex === 0 && pair.length > 1 && styles.dataSlotLeft]}>
              <KpiCell item={item} variant="compact" />
            </View>
          ))}
          {pair.length === 1 ? <View style={styles.dataSlot} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: ownerColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ownerColors.border,
    marginBottom: 16,
    overflow: "hidden",
  },
  panelTitle: {
    fontFamily: ownerFonts.semiBold,
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  heroRow: {
    flexDirection: "row",
    backgroundColor: ownerColors.primarySurface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: ownerColors.border,
  },
  heroSlot: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  heroSlotLeft: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: ownerColors.border,
  },
  dataRow: {
    flexDirection: "row",
    minHeight: 92,
  },
  dataRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ownerColors.border,
  },
  dataSlot: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dataSlotLeft: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: ownerColors.border,
  },
  cell: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  cellHero: { alignItems: "center" },
  cellCompact: { alignItems: "flex-start" },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ownerColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  iconWrapHero: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ownerColors.card,
  },
  cellBody: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    lineHeight: 13,
    marginBottom: 4,
  },
  labelHero: {
    fontSize: 10,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: ownerColors.text,
    lineHeight: 24,
  },
  valueHero: {
    fontSize: 26,
    lineHeight: 30,
  },
  hint: {
    fontSize: 11,
    color: ownerColors.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  hintSuccess: {
    color: ownerColors.success,
    fontWeight: "500",
  },
  hintPlaceholder: {
    height: 14,
    marginTop: 2,
  },
});
