import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";

import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { OWNER_QUICK_NAV } from "@/constants/ownerNav";
import { ownerColors } from "@/constants/ownerTheme";

type IconName = ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<string, IconName> = {
  appointments: "calendar-outline",
  clients: "people-outline",
  staff: "cut-outline",
  services: "cut-outline",
  storefront: "storefront-outline",
  settings: "settings-outline",
};

export default function OwnerMoreTabScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.flex}>
      <OwnerAppBar title={t("owner.tabMore")} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {OWNER_QUICK_NAV.map((item) => (
          <Pressable
            key={item.key}
            style={styles.card}
            onPress={() => router.push(item.href as Href)}>
            <View style={styles.iconWrap}>
              <Ionicons
                name={ICONS[item.key] ?? "chevron-forward"}
                size={22}
                color={ownerColors.primary}
              />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.title}>{t(item.titleKey)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={ownerColors.textDim} />
          </Pressable>
        ))}
        <Pressable
          style={styles.card}
          onPress={() => router.push("/(app)/owner/finance" as Href)}>
          <View style={styles.iconWrap}>
            <Ionicons name="card-outline" size={22} color={ownerColors.primary} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title}>{t("owner.finance")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={ownerColors.textDim} />
        </Pressable>
        <Pressable
          style={styles.card}
          onPress={() => router.push("/(app)/owner/reports" as Href)}>
          <View style={styles.iconWrap}>
            <Ionicons name="bar-chart-outline" size={22} color={ownerColors.primary} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title}>{t("owner.reports")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={ownerColors.textDim} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ownerColors.accentPeach,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  sub: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
});
