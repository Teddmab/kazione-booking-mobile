import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { useStaffUnreadNotificationCount } from "@/hooks/useStaffNotifications";

export function StaffNotificationBell() {
  const router = useRouter();
  const unread = useStaffUnreadNotificationCount();

  return (
    <Pressable
      style={styles.wrap}
      onPress={() => router.push("/(app)/staff/notifications" as Href)}
      accessibilityLabel="Notifications"
      accessibilityRole="button">
      <Ionicons name="notifications-outline" size={22} color={ownerColors.text} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? "9+" : String(unread)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ownerColors.danger,
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
