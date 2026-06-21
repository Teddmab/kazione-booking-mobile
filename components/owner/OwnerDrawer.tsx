import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BusinessSwitcherSheet } from "@/components/owner/BusinessSwitcherSheet";
import { OWNER_DRAWER_SECTIONS } from "@/constants/ownerDrawerNav";
import { Logos } from "@/constants/logos";
import { ownerDrawerColors } from "@/constants/ownerTheme";
import { useOwnerShell } from "@/contexts/OwnerShellContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";

const DRAWER_WIDTH = 288;

function isDrawerItemActive(key: string, pathname: string): boolean {
  if (key === "dashboard") {
    return (
      pathname.includes("/owner/(tabs)") &&
      !pathname.includes("appointments") &&
      !pathname.includes("clients") &&
      !pathname.includes("/staff")
    );
  }
  if (key === "staff") {
    return pathname.includes("/staff");
  }
  if (key === "finance" || key === "reports" || key === "suppliers" || key === "marketplace" || key === "ai-insights") {
    return pathname.includes(`/owner/${key === "ai-insights" ? "ai-insights" : key}`);
  }
  return pathname.includes(`/${key}`);
}

export function OwnerDrawer() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { drawerOpen, closeDrawer } = useOwnerShell();
  const { tenant } = useTenantContext();
  const { user, signOut } = useAuth();
  const slide = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherCreate, setSwitcherCreate] = useState(false);

  const email = user?.email ?? "";
  const initial = email[0]?.toUpperCase() ?? "M";
  const roleLabel =
    tenant?.role === "manager" ? t("owner.roleManager") : t("owner.roleOwner");

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
            <Pressable
              style={styles.businessNameBtn}
              onPress={() => {
                setSwitcherCreate(false);
                setSwitcherOpen(true);
              }}>
              <Text style={styles.businessName} numberOfLines={1}>
                {tenant?.businessName ?? t("owner.brand")}
              </Text>
              <Ionicons name="chevron-down" size={16} color={ownerDrawerColors.textMuted} />
            </Pressable>
            <Pressable
              style={styles.addBusinessBtn}
              accessibilityLabel={t("owner.addBusiness")}
              onPress={() => {
                setSwitcherCreate(true);
                setSwitcherOpen(true);
              }}>
              <Ionicons name="add" size={18} color="#fff" />
            </Pressable>
          </View>

          <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
            {OWNER_DRAWER_SECTIONS.map((section) => (
              <View key={section.titleKey} style={styles.section}>
                <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
                {section.items.map((item) => {
                  const active = isDrawerItemActive(item.key, pathname);
                  return (
                    <Pressable
                      key={item.key}
                      style={[styles.navRow, active && styles.navRowActive]}
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
            <View style={styles.footerAvatar}>
              <Text style={styles.footerAvatarText}>{initial}</Text>
            </View>
            <View style={styles.footerText}>
              <Text style={styles.footerEmail} numberOfLines={1}>
                {email}
              </Text>
              <Text style={styles.footerRole}>{roleLabel}</Text>
            </View>
          </View>

          <Pressable
            style={styles.signOut}
            onPress={() => {
              closeDrawer();
              void signOut();
            }}>
            <Ionicons name="log-out-outline" size={18} color={ownerDrawerColors.textMuted} />
            <Text style={styles.signOutText}>{t("owner.signOut")}</Text>
          </Pressable>
        </Animated.View>
      </View>

      <BusinessSwitcherSheet
        visible={switcherOpen}
        startOnCreate={switcherCreate}
        onClose={() => {
          setSwitcherOpen(false);
          setSwitcherCreate(false);
        }}
      />
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
  businessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  businessNameBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  businessName: { fontSize: 15, color: ownerDrawerColors.text, flex: 1 },
  addBusinessBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ownerDrawerColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: ownerDrawerColors.sectionLabel,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
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
  navRowActive: {
    backgroundColor: ownerDrawerColors.accent,
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
    backgroundColor: ownerDrawerColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  footerAvatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  footerText: { flex: 1, minWidth: 0 },
  footerEmail: { fontSize: 14, color: ownerDrawerColors.text, fontWeight: "500" },
  footerRole: { fontSize: 12, color: ownerDrawerColors.textMuted, marginTop: 2 },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  signOutText: { fontSize: 14, color: ownerDrawerColors.textMuted },
});
