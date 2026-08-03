import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStaffShell } from "@/contexts/StaffShellContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import { roleLabel } from "@/lib/workspaceRouting";

interface Props {
  title?: string;
  subtitle?: string;
  displayTitle?: boolean;
  bottomSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function StaffAppBar({
  title,
  subtitle,
  displayTitle,
  bottomSlot,
  rightSlot,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toggleDrawer } = useStaffShell();
  const { signOut, user } = useAuthContext();
  const { tenant, clearActiveBusiness } = useTenantContext();
  const { data: staff } = useStaffSelf();
  const [menuOpen, setMenuOpen] = useState(false);

  const staffName = staff
    ? (staff.display_name?.trim() ||
        `${staff.first_name} ${staff.last_name}`.trim())
    : null;

  const resolvedTitle = title ?? tenant?.businessName ?? "KaziOne";
  const resolvedSubtitle =
    subtitle ??
    [staffName, roleLabel(tenant?.role ?? "staff", tenant?.position)]
      .filter(Boolean)
      .join(" · ");

  const initials = useMemo(() => {
    if (staffName) {
      return staffName
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() ?? "S";
  }, [staffName, user?.email]);

  const handleLogout = () => {
    setMenuOpen(false);
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: () => {
          void signOut().then(() => router.replace("/(auth)/login" as Href));
        },
      },
    ]);
  };

  const switchWorkspace = () => {
    setMenuOpen(false);
    void clearActiveBusiness().then(() =>
      router.replace("/(auth)/role-select" as Href),
    );
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <Pressable
          style={styles.menuBtn}
          onPress={toggleDrawer}
          accessibilityLabel="Ouvrir le menu"
          accessibilityRole="button">
          <Ionicons name="menu" size={22} color={ownerColors.primary} />
        </Pressable>

        <View style={styles.titleBlock}>
          <Text
            style={[styles.title, displayTitle && styles.titleDisplay]}
            numberOfLines={1}>
            {resolvedTitle}
          </Text>
          {resolvedSubtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {resolvedSubtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {rightSlot}
          <Pressable
            style={styles.avatar}
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Menu profil"
            accessibilityRole="button">
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>
      </View>

      {bottomSlot ? <View style={styles.bottomSlot}>{bottomSlot}</View> : null}

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuName}>{staffName || "Staff"}</Text>
            <Text style={styles.menuEmail}>{staff?.email ?? user?.email ?? ""}</Text>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push("/(app)/staff/profile" as Href);
              }}>
              <Ionicons name="person-outline" size={18} color={ownerColors.text} />
              <Text style={styles.menuItemText}>Mon compte</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={switchWorkspace}>
              <Ionicons name="swap-horizontal-outline" size={18} color={ownerColors.text} />
              <Text style={styles.menuItemText}>{"Changer d'espace"}</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={ownerColors.danger} />
              <Text style={[styles.menuItemText, styles.menuDanger]}>Déconnexion</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
    fontSize: 22,
    fontFamily: ownerFonts.bold,
  },
  subtitle: {
    fontSize: 13,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ownerColors.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: ownerFonts.bold,
  },
  bottomSlot: { marginTop: 10 },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(26,15,10,0.35)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 72,
    paddingRight: 16,
  },
  menuCard: {
    width: 240,
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    gap: 4,
  },
  menuName: {
    fontSize: 15,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  menuEmail: {
    fontSize: 12,
    color: ownerColors.textMuted,
    marginBottom: 8,
    fontFamily: ownerFonts.regular,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 14,
    color: ownerColors.text,
    fontFamily: ownerFonts.medium,
  },
  menuDanger: { color: ownerColors.danger },
});
