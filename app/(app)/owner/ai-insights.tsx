import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { QueryState } from "@/components/owner/QueryState";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useAIInsights, useAIFinanceChat } from "@/hooks/useOwnerAI";
import type { AIInsightItem } from "@/types/finance";
import type { AIInsightPeriod } from "@/services/owner/ai";

function InsightCard({ item }: { item: AIInsightItem }) {
  const color =
    item.priority === "high"
      ? ownerColors.danger
      : item.priority === "medium"
        ? ownerColors.warning
        : ownerColors.success;

  return (
    <View style={styles.insightCard}>
      <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
        <Text style={[styles.badgeText, { color: color }]}>{item.priority}</Text>
      </View>
      <Text style={styles.insightTitle}>{item.title}</Text>
      <Text style={styles.insightBody}>{item.description}</Text>
      <Text style={styles.insightAction}>{item.recommendation}</Text>
    </View>
  );
}

export default function OwnerAIInsightsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [question, setQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);

  const periodMap: Record<"7" | "14" | "30" | "90", AIInsightPeriod> = {
    "7": 7,
    "14": 14,
    "30": 30,
    "90": 90,
  };

  const [periodKey, setPeriodKey] = useState<"7" | "14" | "30" | "90">("30");
  const periodDays = periodMap[periodKey];

  const insights = useAIInsights(businessId, periodDays);
  const chat = useAIFinanceChat(businessId, periodDays);

  const periodChips = useMemo(
    () => [
      { key: "7" as const, label: "7d" },
      { key: "14" as const, label: "14d" },
      { key: "30" as const, label: "30d" },
      { key: "90" as const, label: "90d" },
    ],
    [],
  );

  const ask = () => {
    const q = question.trim();
    if (!q) return;
    chat.mutate(q, {
      onSuccess: (res) => {
        const first = res.insights[0];
        setChatAnswer(first ? `${first.title}\n\n${first.description}\n\n${first.recommendation}` : t("owner.financeAiEmpty"));
      },
    });
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={insights.isRefetching} onRefresh={() => void insights.refetch()} />
      }>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={22} color={ownerColors.primary} />
          <Text style={styles.pageTitle}>{t("owner.aiInsights")}</Text>
        </View>
        {insights.data?.cached ? (
          <Text style={styles.cached}>{t("owner.aiCached")}</Text>
        ) : null}
      </View>

      <TabChipSelector
        value={periodKey}
        chips={periodChips}
        onChange={(k) => setPeriodKey(k)}
      />

      <QueryState
        loading={insights.isLoading}
        error={insights.isError ? (insights.error as Error) : null}
        onRetry={() => void insights.refetch()}>
        {(insights.data?.insights ?? []).length === 0 ? (
          <Text style={styles.empty}>{t("owner.financeAiEmpty")}</Text>
        ) : (
          (insights.data?.insights ?? []).map((item, idx) => (
            <InsightCard key={`${item.title}-${idx}`} item={item} />
          ))
        )}
      </QueryState>

      <Text style={styles.section}>{t("owner.aiFinanceChat")}</Text>
      <View style={styles.chatCard}>
        <TextInput
          style={styles.chatInput}
          value={question}
          onChangeText={setQuestion}
          placeholder={t("owner.aiFinancePlaceholder")}
          multiline
        />
        <Pressable style={ownerStyles.primaryBtn} onPress={ask} disabled={chat.isPending}>
          <Text style={ownerStyles.primaryBtnText}>
            {chat.isPending ? t("common.loading") : t("owner.aiAsk")}
          </Text>
        </Pressable>
        {chatAnswer ? <Text style={styles.chatAnswer}>{chatAnswer}</Text> : null}
      </View>

      <Pressable style={styles.financeLink} onPress={() => router.push("/(app)/owner/finance" as Href)}>
        <Text style={styles.financeLinkText}>{t("owner.aiViewFinance")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pageTitle: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  cached: { fontSize: 11, color: ownerColors.textDim },
  empty: { fontSize: 14, color: ownerColors.textMuted, marginTop: 16 },
  insightCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginTop: 12,
  },
  badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  insightTitle: { fontSize: 16, fontWeight: "700", color: ownerColors.text, marginBottom: 6 },
  insightBody: { fontSize: 14, color: ownerColors.textMuted, lineHeight: 20 },
  insightAction: { fontSize: 13, color: ownerColors.primary, marginTop: 8, fontWeight: "500" },
  section: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
  chatCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    gap: 10,
  },
  chatInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: ownerColors.text,
    textAlignVertical: "top",
    backgroundColor: ownerColors.bg,
  },
  chatAnswer: { fontSize: 14, color: ownerColors.text, lineHeight: 20, marginTop: 4 },
  financeLink: { marginTop: 16, alignItems: "center" },
  financeLinkText: { fontSize: 14, fontWeight: "600", color: ownerColors.primary },
});
