import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";

export type AttentionTone = "amber" | "violet" | "coral";

export type AttentionCard = {
  key: string;
  tone: AttentionTone;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail?: string;
  chips?: string[];
  action: string;
  onPress: () => void;
};

const TONE = {
  amber: {
    bg: "rgba(255, 251, 235, 0.95)",
    border: "#FDE68A",
    icon: "#D97706",
    action: "#B45309",
    chipBg: "rgba(254, 243, 199, 0.8)",
    chipText: "#B45309",
  },
  violet: {
    bg: "rgba(245, 243, 255, 0.95)",
    border: "#DDD6FE",
    icon: "#7C3AED",
    action: "#6D28D9",
    chipBg: "rgba(237, 233, 254, 0.8)",
    chipText: "#6D28D9",
  },
  coral: {
    bg: "rgba(255, 247, 237, 0.95)",
    border: "#FED7AA",
    icon: "#EA580C",
    action: "#C2410C",
    chipBg: "rgba(255, 237, 213, 0.8)",
    chipText: "#C2410C",
  },
} as const;

export function OwnerAttentionSection({ cards }: { cards: AttentionCard[] }) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{t("owner.attentionTitle")}</Text>
      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-circle-outline" size={18} color={ownerColors.textMuted} />
          <Text style={styles.emptyText}>{t("owner.attentionEmpty")}</Text>
        </View>
      ) : (
        cards.map((card) => {
          const tone = TONE[card.tone];
          return (
            <Pressable
              key={card.key}
              style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.border }]}
              onPress={card.onPress}>
              <View style={styles.row}>
                <Ionicons name={card.icon} size={16} color={tone.icon} style={styles.icon} />
                <View style={styles.body}>
                  <Text style={styles.title}>{card.title}</Text>
                  {card.detail ? <Text style={styles.detail}>{card.detail}</Text> : null}
                  {card.chips?.length ? (
                    <View style={styles.chips}>
                      {card.chips.slice(0, 3).map((chip) => (
                        <View
                          key={chip}
                          style={[styles.chip, { backgroundColor: tone.chipBg }]}>
                          <Text style={[styles.chipText, { color: tone.chipText }]}>{chip}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
              <Text style={[styles.action, { color: tone.action }]}>
                {card.action} →
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginBottom: 20 },
  heading: {
    fontFamily: ownerFonts.semiBold,
    fontSize: 14,
    color: ownerColors.text,
  },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.primarySurface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyText: { flex: 1, fontSize: 13, color: ownerColors.textMuted },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  icon: { marginTop: 2 },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: ownerFonts.semiBold, fontSize: 14, color: ownerColors.text },
  detail: { fontSize: 12, color: ownerColors.textMuted, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, fontFamily: ownerFonts.medium },
  action: { fontSize: 12, fontFamily: ownerFonts.medium },
});
