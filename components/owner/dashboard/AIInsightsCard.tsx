import { useRouter, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { DashboardPanel } from "@/components/owner/dashboard/DashboardPanel";
import { ownerColors } from "@/constants/ownerTheme";
import type { AIInsightItem } from "@/types/finance";

interface Props {
  insights: AIInsightItem[];
  loading?: boolean;
}

export function AIInsightsCard({ insights, loading }: Props) {
  const router = useRouter();
  const list = insights.slice(0, 3);

  return (
    <DashboardPanel
      title="AI Insights"
      subtitle="Personalized recommendations for your salon"
      icon="sparkles-outline"
      actionLabel="Voir tout"
      onAction={() => router.push("/(app)/owner/ai-insights" as Href)}>
      {loading ? (
        <Text style={styles.empty}>Chargement…</Text>
      ) : list.length === 0 ? (
        <Text style={styles.empty}>Aucun insight pour le moment</Text>
      ) : (
        list.map((item, i) => (
          <View key={`${item.title}-${i}`} style={styles.row}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.type}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            </View>
          </View>
        ))
      )}
    </DashboardPanel>
  );
}

const styles = StyleSheet.create({
  empty: { padding: 16, fontSize: 14, color: ownerColors.textMuted },
  row: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ownerColors.border,
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: ownerColors.primaryMuted,
  },
  tagText: { fontSize: 10, fontWeight: "700", color: ownerColors.primary },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  desc: { fontSize: 12, color: ownerColors.textMuted, marginTop: 4, lineHeight: 18 },
});
