import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";

export type StaffTodayEntry = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  until: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function OwnerStaffTodayPanel({
  entries,
  onViewAll,
}: {
  entries: StaffTodayEntry[];
  onViewAll: () => void;
}) {
  const { t } = useTranslation();
  const visible = entries.slice(0, 6);
  const overflow = entries.length - visible.length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {t("owner.dashStaffToday")} · {entries.length} {t("owner.dashWorking")}
      </Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>{t("owner.dashStaffTodayEmpty")}</Text>
      ) : (
        <View style={styles.row}>
          {visible.map((e) => (
            <View key={e.id} style={styles.person}>
              {e.avatar_url ? (
                <Image source={{ uri: e.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.fallback]}>
                  <Text style={styles.initials}>{initials(e.display_name)}</Text>
                </View>
              )}
              <Text style={styles.name} numberOfLines={1}>
                {e.display_name.split(" ")[0]}
              </Text>
              {e.until ? <Text style={styles.until}>{e.until}</Text> : null}
            </View>
          ))}
          {overflow > 0 ? (
            <View style={styles.person}>
              <View style={[styles.avatar, styles.moreAvatar]}>
                <Text style={styles.moreText}>+{overflow}</Text>
              </View>
              <Text style={styles.moreLabel}>{t("owner.dashMore")}</Text>
            </View>
          ) : null}
        </View>
      )}
      <Pressable onPress={onViewAll} hitSlop={8}>
        <Text style={styles.link}>{t("owner.dashViewAllStaff")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontFamily: ownerFonts.semiBold,
    fontSize: 14,
    color: ownerColors.text,
    marginBottom: 14,
  },
  empty: { fontSize: 13, color: ownerColors.textMuted, marginBottom: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  person: { width: 64, alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  fallback: {
    backgroundColor: ownerColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: ownerColors.primary,
  },
  initials: { fontSize: 11, fontFamily: ownerFonts.bold, color: ownerColors.text },
  name: { fontSize: 11, fontFamily: ownerFonts.medium, color: ownerColors.text, marginTop: 4, textAlign: "center" },
  until: { fontSize: 10, color: ownerColors.textMuted, textAlign: "center" },
  moreAvatar: {
    backgroundColor: ownerColors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { fontSize: 11, fontFamily: ownerFonts.bold, color: ownerColors.textMuted },
  moreLabel: { fontSize: 11, fontFamily: ownerFonts.medium, color: ownerColors.primary, marginTop: 4 },
  link: { fontSize: 12, fontFamily: ownerFonts.medium, color: ownerColors.primary },
});
