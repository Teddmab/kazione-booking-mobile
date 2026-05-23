import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ownerColors } from "@/constants/ownerTheme";
import type { AIInsightItem } from "@/types/finance";

type Props = {
  insights: AIInsightItem[];
  loading?: boolean;
  onRefresh?: () => void;
};

function priorityColor(priority: AIInsightItem["priority"]) {
  if (priority === "high") return ownerColors.danger;
  if (priority === "medium") return ownerColors.warning;
  return ownerColors.success;
}

export function FinanceInsightCard({ insights, loading, onRefresh }: Props) {
  const { t } = useTranslation();
  const top = insights[0];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={18} color={ownerColors.primary} />
          <Text style={styles.title}>{t("owner.financeAiTitle")}</Text>
        </View>
        {onRefresh ? (
          <Pressable onPress={onRefresh} accessibilityLabel={t("owner.financeAiRefresh")}>
            <Ionicons name="refresh-outline" size={20} color={ownerColors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {loading && !top ? (
        <Text style={styles.muted}>{t("common.loading")}</Text>
      ) : top ? (
        <>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: `${priorityColor(top.priority)}22` }]}>
              <Text style={[styles.badgeText, { color: priorityColor(top.priority) }]}>
                {top.priority}
              </Text>
            </View>
          </View>
          <Text style={styles.headline}>{top.title}</Text>
          <Text style={styles.body}>{top.description}</Text>
          <Text style={styles.action}>{top.recommendation}</Text>
        </>
      ) : (
        <Text style={styles.muted}>{t("owner.financeAiEmpty")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "700", color: ownerColors.text },
  muted: { fontSize: 14, color: ownerColors.textMuted, lineHeight: 20 },
  badgeRow: { marginBottom: 8 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  headline: { fontSize: 15, fontWeight: "600", color: ownerColors.text, marginBottom: 6 },
  body: { fontSize: 14, color: ownerColors.textMuted, lineHeight: 20, marginBottom: 8 },
  action: { fontSize: 13, color: ownerColors.primary, fontWeight: "500", lineHeight: 18 },
});
