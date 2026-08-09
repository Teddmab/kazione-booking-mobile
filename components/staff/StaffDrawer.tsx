import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname, type Href } from "expo-router";
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
import { ownerDrawerColors, ownerFonts } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStaffShell } from "@/contexts/StaffShellContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useThemeColors } from "@/contexts/AppThemeContext";
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
  "account",
]);

function isDrawerItemActive(key: string, pathname: string): boolean {
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
  if (key === "reports") return pathname.includes("/performance");
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
  const { drawerOpen, closeDrawer } = useStaffShell();
  const { tenant, clearActiveBusiness } = useTenantContext();
  const { user, signOut } = useAuthContext();
  const { data: staff } = useStaffSelf();
  const settingsQ = useBusinessSettings(tenant?.businessId ?? "");
  const colors = useThemeColors();
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
    router.push(href);
  };

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
              source={Logos.whiteFull}
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
                  const active = isDrawerItemActive(item.key, pathname);
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
                        color={active ? "#fff" : ownerDrawerColors.icon}
                      />
                      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
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
            style={styles.switchWorkspace}
            onPress={() => {
              closeDrawer();
              void clearActiveBusiness().then(() =>
                router.replace("/(auth)/role-select" as Href),
              );
            }}>
            <Ionicons
              name="swap-horizontal-outline"
              size={18}
              color={ownerDrawerColors.textMuted}
            />
            <Text style={styles.signOutText}>{t("staffNav.switchWorkspace")}</Text>
          </Pressable>

          <Pressable
            style={styles.signOut}
            onPress={() => {
              closeDrawer();
              void signOut().then(() => router.replace("/(auth)/login" as Href));
            }}>
            <Ionicons name="log-out-outline" size={18} color={ownerDrawerColors.textMuted} />
            <Text style={styles.signOutText}>{t("staffNav.signOut")}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: ownerDrawerColors.bg,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  brandRow: { marginBottom: 20 },
  logo: { width: 140, height: 46 },
  businessRow: { marginBottom: 20 },
  businessName: { fontSize: 15, color: ownerDrawerColors.text, fontWeight: "600" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: ownerDrawerColors.sectionLabel,
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
  navLabel: { fontSize: 15, color: ownerDrawerColors.textMuted, fontWeight: "500" },
  navLabelActive: { color: "#fff", fontWeight: "600" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: ownerDrawerColors.border,
  },
  footerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footerAvatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  footerText: { flex: 1, minWidth: 0 },
  footerEmail: { fontSize: 14, color: ownerDrawerColors.text, fontWeight: "500" },
  footerRole: { fontSize: 12, color: ownerDrawerColors.textMuted, marginTop: 2 },
  switchWorkspace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  signOutText: { fontSize: 14, color: ownerDrawerColors.textMuted },
});
