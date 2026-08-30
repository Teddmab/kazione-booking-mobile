import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LanguageSelector } from "@/components/LanguageSelector";
import { Logos } from "@/constants/logos";
import { STAFF_DRAWER_SECTIONS } from "@/constants/staffDrawerNav";
import { ownerFonts } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStaffShell } from "@/contexts/StaffShellContext";
import { useTenantContext } from "@/contexts/TenantContext";
import {
  useAppTheme,
  useThemeColors,
  type ThemeColors,
} from "@/contexts/AppThemeContext";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import { roleLabel } from "@/lib/workspaceRouting";

const DRAWER_WIDTH = 288;

/** Keys gated by staff_module_permissions; reviews + notifications always shown */
const PERMISSION_KEYS = new Set([
  "dashboard",
  "appointments",
  "clients",
  "services",
  "reports",
  "earnings",
  "account",
]);

function isDrawerItemActive(
  key: string,
  pathname: string,
  tab?: string | string[],
): boolean {
  const tabValue = Array.isArray(tab) ? tab[0] : tab;
  if (key === "dashboard") {
    return (
      pathname.includes("/today") ||
      pathname.endsWith("/staff") ||
      pathname.endsWith("/staff/")
    );
  }
  if (key === "appointments") return pathname.includes("/calendar");
  if (key === "clients") return pathname.includes("/clients");
  if (key === "services") return pathname.includes("/services");
  if (key === "reports") {
    return (
      pathname.includes("/performance") && tabValue !== "earnings"
    );
  }
  if (key === "earnings") {
    return (
      pathname.includes("/earnings") ||
      (pathname.includes("/performance") && tabValue === "earnings")
    );
  }
  if (key === "training") return pathname.includes("/training");
  if (key === "reviews") return pathname.includes("/reviews");
  if (key === "notifications") return pathname.includes("/notifications");
  if (key === "account") return pathname.includes("/profile");
  return false;
}

export function StaffDrawer() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { drawerOpen, closeDrawer } = useStaffShell();
  const { tenant } = useTenantContext();
  const { user, signOut } = useAuthContext();
  const { data: staff } = useStaffSelf();
  const settingsQ = useBusinessSettings(tenant?.businessId ?? "");
  const colors = useThemeColors();
  const { resolvedMode } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const slide = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const email = user?.email ?? "";
  const displayName =
    staff?.display_name?.trim() ||
    (staff
      ? `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.trim()
      : "") ||
    email ||
    "Staff";
  const initial =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "S";

  const sections = useMemo(() => {
    const perms = settingsQ.data?.settings?.staff_module_permissions ?? {};
    return STAFF_DRAWER_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!PERMISSION_KEYS.has(item.key)) return true;
        return perms[item.key] !== false;
      }),
    })).filter((section) => section.items.length > 0);
  }, [settingsQ.data?.settings?.staff_module_permissions]);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: drawerOpen ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen, slide]);

  const navigate = (href: Href) => {
    closeDrawer();
    router.navigate(href);
  };

  const logoSource =
    resolvedMode === "dark" ? Logos.whiteFull : Logos.blackFull;

  return (
    <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={closeDrawer}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={closeDrawer} />
        <Animated.View
          style={[
            styles.panel,
            { paddingTop: insets.top + 16, transform: [{ translateX: slide }] },
          ]}>
          <View style={styles.brandRow}>
            <Image
              source={logoSource}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="KaziOne"
            />
          </View>

          <View style={styles.businessRow}>
            <Text style={styles.businessName} numberOfLines={1}>
              {tenant?.businessName ?? "KaziOne"}
            </Text>
          </View>

          <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
            {sections.map((section) => (
              <View key={section.titleKey} style={styles.section}>
                <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
                {section.items.map((item) => {
                  const active = isDrawerItemActive(
                    item.key,
                    pathname,
                    params.tab,
                  );
                  return (
                    <Pressable
                      key={item.key}
                      style={[
                        styles.navRow,
                        active && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => navigate(item.href)}>
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={active ? "#fff" : colors.textMuted}
                      />
                      <Text
                        style={[styles.navLabel, active && styles.navLabelActive]}>
                        {t(item.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={[styles.footerAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.footerAvatarText}>{initial}</Text>
            </View>
            <View style={styles.footerText}>
              <Text style={styles.footerEmail} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.footerRole}>
                {roleLabel(tenant?.role ?? "staff", tenant?.position)}
              </Text>
            </View>
            <LanguageSelector variant="compact" tone="drawer" />
          </View>

          <Pressable
            style={styles.signOut}
            onPress={() => {
              closeDrawer();
              void signOut().then(() => router.replace("/(auth)/login" as Href));
            }}>
            <Ionicons name="log-out-outline" size={18} color={colors.textMuted} />
            <Text style={styles.signOutText}>{t("staffNav.signOut")}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, flexDirection: "row" },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    panel: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: colors.card,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    brandRow: { marginBottom: 20 },
    logo: { width: 140, height: 46 },
    businessRow: { marginBottom: 20 },
    businessName: {
      fontSize: 15,
      color: colors.text,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    section: { marginBottom: 16 },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textDim,
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
      fontFamily: ownerFonts.semiBold,
    },
    nav: { flex: 1 },
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 2,
    },
    navLabel: {
      fontSize: 15,
      color: colors.textMuted,
      fontWeight: "500",
      fontFamily: ownerFonts.medium,
    },
    navLabelActive: {
      color: "#fff",
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    footerAvatarText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
      fontFamily: ownerFonts.bold,
    },
    footerText: { flex: 1, minWidth: 0 },
    footerEmail: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
      fontFamily: ownerFonts.medium,
    },
    footerRole: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    signOut: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    signOutText: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
  });
}
