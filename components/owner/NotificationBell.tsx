import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import { useUnreadNotificationCount } from "@/hooks/useOwnerNotifications";

export function NotificationBell() {
  const router = useRouter();
  const unread = useUnreadNotificationCount();

  return (
    <Pressable
      style={styles.wrap}
      onPress={() => router.push("/(app)/owner/notifications" as Href)}
      accessibilityLabel="Notifications">
      <Text style={styles.icon}>🔔</Text>
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? "9+" : String(unread)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginRight: 12, padding: 4, position: "relative" },
  icon: { fontSize: 20 },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ownerColors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
});
