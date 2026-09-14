import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useTenantContext, type TenantContextValue } from "@/contexts/TenantContext";
import { useWorkspaceSwitchSheet } from "@/contexts/WorkspaceSwitchContext";
import {
  isOwnerMembership,
  isPortalMembership,
  isStaffMembership,
  roleLabel,
  workspaceRouteForMembership,
} from "@/lib/workspaceRouting";

function roleIcon(
  role: TenantContextValue["role"],
): keyof typeof Ionicons.glyphMap {
  if (role === "owner" || role === "manager") return "briefcase-outline";
  if (role === "staff") return "cut-outline";
  return "desktop-outline";
}

export function WorkspaceSwitchSheet() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { open, closeSwitch } = useWorkspaceSwitchSheet();
  const { businesses, tenant, selectMembership } = useTenantContext();
  const [busyId, setBusyId] = useState<string | null>(null);

  const memberships = useMemo(
    () => businesses.filter((b) => isPortalMembership(b.role)),
    [businesses],
  );

  const crossPortal =
    memberships.some((b) => isOwnerMembership(b.role)) &&
    memberships.some((b) => isStaffMembership(b.role));

  const title = crossPortal
    ? t("common.switchPortalTitle")
    : t("common.switchWorkspace");
  const subtitle = crossPortal
    ? t("common.switchSheetSubtitlePortal")
    : t("common.switchSheetSubtitle");

  async function onSelect(membership: TenantContextValue) {
    const key = `${membership.businessId}:${membership.role}`;
    if (
      tenant?.businessId === membership.businessId &&
      tenant?.role === membership.role
    ) {
      closeSwitch();
      return;
    }

    setBusyId(key);
    try {
      await selectMembership(membership);
      closeSwitch();
      router.replace(workspaceRouteForMembership(membership.role) as Href);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={closeSwitch}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={closeSwitch} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}>
          <View style={styles.handle} />

          <View style={styles.head}>
            <View style={styles.headIcon}>
              <Ionicons
                name="swap-horizontal"
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.headText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <Pressable
              onPress={closeSwitch}
              hitSlop={12}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {memberships.map((item) => {
              const key = `${item.businessId}:${item.role}`;
              const active =
                tenant?.businessId === item.businessId &&
                tenant?.role === item.role;
              const loading = busyId === key;

              return (
                <Pressable
                  key={key}
                  style={[styles.row, active && styles.rowActive]}
                  disabled={!!busyId}
                  onPress={() => void onSelect(item)}>
                  <View
                    style={[
                      styles.iconWrap,
                      active && { backgroundColor: colors.primarySurface },
                    ]}>
                    <Ionicons
                      name={roleIcon(item.role)}
                      size={20}
                      color={active ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <View style={styles.rowBody}>
                    <Text
                      style={[styles.rowTitle, active && { color: colors.primary }]}
                      numberOfLines={1}>
                      {item.businessName}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {roleLabel(item.role, item.position)}
                    </Text>
                  </View>
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : active ? (
                    <View style={styles.check}>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textDim}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable style={styles.cancelBtn} onPress={closeSwitch}>
            <Text style={styles.cancelText}>{t("common.cancel")}</Text>
          </Pressable>
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
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
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
      marginBottom: 10,
    },
    head: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    headIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.primarySurface,
      alignItems: "center",
      justifyContent: "center",
    },
    headText: { flex: 1, minWidth: 0, paddingTop: 2 },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
      marginTop: 4,
      fontFamily: ownerFonts.regular,
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
      marginTop: 4,
    },
    scroll: { flexGrow: 0 },
    scrollContent: {
      paddingHorizontal: 12,
      paddingBottom: 8,
      gap: 6,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    rowActive: {
      borderColor: colors.primary + "55",
      backgroundColor: colors.primarySurface,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    rowBody: { flex: 1, minWidth: 0 },
    rowTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    rowMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    check: { paddingLeft: 4 },
    cancelBtn: {
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      paddingVertical: 14,
      alignItems: "center",
    },
    cancelText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
  });
}
