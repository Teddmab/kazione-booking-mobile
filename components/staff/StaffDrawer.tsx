import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname, type Href } from "expo-router";
import { useEffect, useRef } from "react";
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

import { Logos } from "@/constants/logos";
import { STAFF_DRAWER_SECTIONS } from "@/constants/staffDrawerNav";
import { ownerDrawerColors } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStaffShell } from "@/contexts/StaffShellContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { roleLabel } from "@/lib/workspaceRouting";

const DRAWER_WIDTH = 288;

function isDrawerItemActive(key: string, pathname: string): boolean {
  if (key === "dashboard") {
    return pathname.includes("/today") || pathname.endsWith("/staff") || pathname.endsWith("/staff/");
  }
  if (key === "appointments") return pathname.includes("/calendar");
  if (key === "clients") return pathname.includes("/clients");
  if (key === "services") return pathname.includes("/services");
  if (key === "reports") return pathname.includes("/performance");
  if (key === "reviews") return pathname.includes("/reviews");
  if (key === "account") return pathname.includes("/profile");
  return false;
}

export function StaffDrawer() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { drawerOpen, closeDrawer } = useStaffShell();
  const { tenant, clearActiveBusiness } = useTenantContext();
  const { user, signOut } = useAuthContext();
  const slide = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const email = user?.email ?? "";
  const initial = email[0]?.toUpperCase() ?? "S";

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
            {STAFF_DRAWER_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
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
                        {item.label}
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
              <Text style={styles.footerRole}>
                {roleLabel(tenant?.role ?? "staff", tenant?.position)}
              </Text>
            </View>
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
            <Text style={styles.signOutText}>Changer d'espace</Text>
          </Pressable>

          <Pressable
            style={styles.signOut}
            onPress={() => {
              closeDrawer();
              void signOut().then(() => router.replace("/(auth)/login" as Href));
            }}>
            <Ionicons name="log-out-outline" size={18} color={ownerDrawerColors.textMuted} />
            <Text style={styles.signOutText}>Déconnexion</Text>
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
  navRowActive: { backgroundColor: ownerDrawerColors.accent },
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
