import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOwnerShell } from "@/contexts/OwnerShellContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { OwnerAvatarMenu } from "@/components/owner/OwnerAvatarMenu";
import { useUnreadNotificationCount } from "@/hooks/useOwnerNotifications";
import { useTranslation } from "react-i18next";

interface Props {
  title: string;
  subtitle?: string;
  /** Dashboard uses larger bold title */
  displayTitle?: boolean;
  rightSlot?: React.ReactNode;
  /** Second row under title (e.g. week navigation) */
  bottomSlot?: React.ReactNode;
}

export function OwnerAppBar({ title, subtitle, displayTitle, rightSlot, bottomSlot }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { toggleDrawer } = useOwnerShell();
  const router = useRouter();
  const { user } = useAuth();
  const { tenant } = useTenantContext();
  const unread = useUnreadNotificationCount();

  const initial =
    user?.email?.[0]?.toUpperCase() ??
    tenant?.businessName?.[0]?.toUpperCase() ??
    "M";

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <Pressable
          style={styles.menuBtn}
          onPress={toggleDrawer}
          accessibilityLabel={t("owner.openMenu")}>
          <Ionicons name="menu" size={22} color={ownerColors.primary} />
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={[styles.title, displayTitle && styles.titleDisplay]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {rightSlot}
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push("/(app)/owner/notifications" as Href)}
            accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={22} color={ownerColors.text} />
            {unread > 0 ? <View style={styles.dot} /> : null}
          </Pressable>
          <OwnerAvatarMenu initial={initial} />
        </View>
      </View>
      {bottomSlot ? <View style={styles.bottomSlot}>{bottomSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: ownerColors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ownerColors.border,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  titleDisplay: {
    fontFamily: ownerFonts.bold,
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  bottomSlot: { marginTop: 10, paddingLeft: 50 },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ownerColors.warning,
    borderWidth: 1.5,
    borderColor: ownerColors.bg,
  },
});
