import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StaffNotificationBell } from "@/components/staff/StaffNotificationBell";
import { ownerFonts } from "@/constants/ownerTheme";
import { useAppTheme } from "@/contexts/AppThemeContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStaffShell } from "@/contexts/StaffShellContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import { useWorkspaceSwitch } from "@/hooks/useWorkspaceSwitch";
import { roleLabel } from "@/lib/workspaceRouting";

interface Props {
  title?: string;
  subtitle?: string;
  displayTitle?: boolean;
  bottomSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  /** When set, shows a back chevron before the title. */
  onBack?: () => void;
}

export function StaffAppBar({
  title,
  subtitle,
  displayTitle,
  bottomSlot,
  rightSlot,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { openMore } = useStaffShell();
  const { signOut, user } = useAuthContext();
  const { tenant } = useTenantContext();
  const { data: staff } = useStaffSelf();
  const { colors } = useAppTheme();
  const { canSwitch, switchWorkspace } = useWorkspaceSwitch();
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
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.bg,
          borderBottomColor: colors.border,
        },
      ]}>
      <View style={styles.row}>
        <View style={styles.titleBlock}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={10}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel={t("common.back", { defaultValue: "Retour" })}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
          ) : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[
                styles.title,
                { color: colors.text },
                displayTitle && styles.titleDisplay,
              ]}
              numberOfLines={1}>
              {resolvedTitle}
            </Text>
            {resolvedSubtitle ? (
              <Text
                style={[styles.subtitle, { color: colors.textMuted }]}
                numberOfLines={1}>
                {resolvedSubtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          {rightSlot}
          <StaffNotificationBell />
          <Pressable
            style={[styles.avatar, { backgroundColor: colors.avatar }]}
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
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuOpen(false)}>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.menuName, { color: colors.text }]}>
              {staffName || "Staff"}
            </Text>
            <Text style={[styles.menuEmail, { color: colors.textMuted }]}>
              {staff?.email ?? user?.email ?? ""}
            </Text>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push("/(app)/staff/(tabs)/profile" as Href);
              }}>
              <Ionicons name="person-outline" size={18} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                {t("common.myAccount")}
              </Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                openMore();
              }}>
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={colors.text}
              />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                {t("staffNav.more")}
              </Text>
            </Pressable>
            {canSwitch ? (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  switchWorkspace();
                }}>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={18}
                  color={colors.text}
                />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  {t("common.switchWorkspace")}
                </Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[styles.menuItemText, { color: colors.danger }]}>
                {t("common.signOut")}
              </Text>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: ownerFonts.bold,
  },
  titleDisplay: {
    fontSize: 22,
    fontFamily: ownerFonts.bold,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  menuName: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: ownerFonts.bold,
  },
  menuEmail: {
    fontSize: 12,
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
    fontFamily: ownerFonts.medium,
  },
});
