import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname, useLocalSearchParams, type Href } from "expo-router";
import { useMemo } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { LanguageSelector } from "@/components/LanguageSelector";
import {
  STAFF_MORE_ITEMS,
  STAFF_PERMISSION_KEYS,
} from "@/constants/staffDrawerNav";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStaffShell } from "@/contexts/StaffShellContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

function isMoreItemActive(
  key: string,
  pathname: string,
  tab?: string | string[],
): boolean {
  const tabValue = Array.isArray(tab) ? tab[0] : tab;
  if (key === "clients") return pathname.includes("/clients");
  if (key === "reports") {
    return pathname.includes("/performance") && tabValue !== "earnings";
  }
  if (key === "earnings") {
    return (
      pathname.includes("/earnings") ||
      (pathname.includes("/performance") && tabValue === "earnings")
    );
  }
  if (key === "training") return pathname.includes("/training");
  if (key === "notifications") return pathname.includes("/notifications");
  if (key === "account") return pathname.includes("/profile");
  return false;
}

export function StaffMoreSheet() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ tab?: string }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { moreOpen, closeMore } = useStaffShell();
  const { tenant } = useTenantContext();
  const { signOut } = useAuthContext();
  const settingsQ = useBusinessSettings(tenant?.businessId ?? "");

  const items = useMemo(() => {
    const perms = settingsQ.data?.settings?.staff_module_permissions ?? {};
    return STAFF_MORE_ITEMS.filter((item) => {
      if (!STAFF_PERMISSION_KEYS.has(item.key)) return true;
      return perms[item.key] !== false;
    });
  }, [settingsQ.data?.settings?.staff_module_permissions]);

  function handleSignOut() {
    closeMore();
    Alert.alert(t("common.signOut"), t("common.signOutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.signOut"),
        style: "destructive",
        onPress: () => {
          void signOut().then(() => router.replace("/(auth)/login" as Href));
        },
      },
    ]);
  }

  function navigate(href: Href) {
    closeMore();
    router.push(href);
  }

  return (
    <Modal
      visible={moreOpen}
      transparent
      animationType="slide"
      onRequestClose={closeMore}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={closeMore} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title}>{t("staffNav.more")}</Text>
            <Pressable onPress={closeMore} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {items.map((item) => {
              const active = isMoreItemActive(item.key, pathname, params.tab);
              return (
                <Pressable
                  key={item.key}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => navigate(item.href)}>
                  <View
                    style={[
                      styles.iconWrap,
                      active && { backgroundColor: colors.primarySurface },
                    ]}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={active ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <Text
                    style={[styles.rowLabel, active && { color: colors.primary }]}>
                    {t(item.labelKey)}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textDim}
                  />
                </Pressable>
              );
            })}

            <View style={styles.divider} />

            <View style={styles.langBlock}>
              <Text style={styles.sectionLabel}>{t("nav.language")}</Text>
              <LanguageSelector />
            </View>

            <Pressable style={styles.signOut} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={styles.signOutText}>{t("staffNav.signOut")}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "78%",
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 8,
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
    scroll: { flexGrow: 0 },
    scrollContent: {
      paddingHorizontal: 12,
      paddingBottom: 8,
      gap: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 12,
    },
    rowActive: {
      backgroundColor: colors.primarySurface,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: 8,
      marginHorizontal: 8,
    },
    langBlock: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      fontFamily: ownerFonts.bold,
    },
    signOut: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 4,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: colors.danger + "44",
      backgroundColor: colors.dangerMuted,
      borderRadius: 12,
      paddingVertical: 13,
    },
    signOutText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.danger,
      fontFamily: ownerFonts.bold,
    },
  });
}
