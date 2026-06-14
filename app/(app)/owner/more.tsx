import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { ownerColors } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";

const LINKS: { titleKey: string; descKey: string; href: Href }[] = [
  { titleKey: "owner.finance", descKey: "owner.moreFinanceDesc", href: "/(app)/owner/finance" as Href },
  { titleKey: "owner.reports", descKey: "owner.moreReportsDesc", href: "/(app)/owner/reports" as Href },
  { titleKey: "owner.aiInsights", descKey: "owner.moreAiDesc", href: "/(app)/owner/ai-insights" as Href },
  { titleKey: "owner.marketplace", descKey: "owner.moreMarketplaceDesc", href: "/(app)/owner/marketplace" as Href },
  { titleKey: "owner.suppliers", descKey: "owner.moreSuppliersDesc", href: "/(app)/owner/suppliers" as Href },
];

export default function OwnerMoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut } = useAuthContext();

  const handleSignOut = () => {
    Alert.alert(t("owner.signOut"), t("owner.signOutConfirm"), [
      { text: t("owner.cancel"), style: "cancel" },
      { text: t("owner.signOut"), style: "destructive", onPress: () => void signOut() },
    ]);
  };

  return (
    <OwnerStackShell title={t("owner.tabMore")}>
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <Text style={styles.intro}>{t("owner.moreIntro")}</Text>
      {LINKS.map((item) => (
        <Pressable key={item.titleKey} style={styles.card} onPress={() => router.push(item.href)}>
          <Text style={styles.title}>{t(item.titleKey)}</Text>
          <Text style={styles.desc}>{t(item.descKey)}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color={ownerColors.danger} />
        <Text style={styles.signOutText}>{t("owner.signOut")}</Text>
      </Pressable>
    </ScrollView>
    </OwnerStackShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  intro: { fontSize: 15, color: ownerColors.textMuted, lineHeight: 22, marginBottom: 20 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    marginBottom: 20,
    overflow: "hidden",
    padding: 14,
  },
  title: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  desc: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4, lineHeight: 20 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: ownerColors.danger,
  },
});
