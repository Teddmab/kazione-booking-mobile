import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useStaffUnreadNotificationCount } from "@/hooks/useStaffNotifications";

export function StaffNotificationBell() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const unread = useStaffUnreadNotificationCount();
  const hasUnread = unread > 0;

  return (
    <Pressable
      style={styles.wrap}
      onPress={() => router.push("/(app)/staff/(tabs)/notifications" as Href)}
      accessibilityLabel={t("staffNotifPage.title")}
      accessibilityRole="button">
      <Ionicons
        name={hasUnread ? "notifications" : "notifications-outline"}
        size={24}
        color={hasUnread ? colors.primary : colors.text}
      />
      {hasUnread ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unread > 9 ? "9+" : String(unread)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      backgroundColor: "transparent",
    },
    badge: {
      position: "absolute",
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.danger,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    badgeText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
    },
  });
}
