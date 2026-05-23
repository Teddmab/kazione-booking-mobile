import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  initial: string;
}

type MenuItem = {
  key: string;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

function getDisplayName(user: ReturnType<typeof useAuth>["user"]) {
  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  return meta?.full_name ?? meta?.name ?? user?.email ?? "User";
}

function getInitials(displayName: string) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function OwnerAvatarMenu({ initial }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const close = () => setOpen(false);

  const goSettings = () => {
    close();
    router.push("/(app)/owner/settings" as Href);
  };

  const handleSignOut = () => {
    close();
    void signOut().then(() => router.replace("/(auth)/welcome" as Href));
  };

  const items: MenuItem[] = [
    { key: "profile", labelKey: "owner.profile", icon: "person-outline", onPress: goSettings },
    { key: "settings", labelKey: "owner.settings", icon: "settings-outline", onPress: goSettings },
    {
      key: "signOut",
      labelKey: "owner.signOut",
      icon: "log-out-outline",
      destructive: true,
      onPress: handleSignOut,
    },
  ];

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityLabel={displayName}
        accessibilityRole="button">
        <Text style={styles.triggerText}>{initials || initial}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <View style={styles.dropdownWrap}>
            <Pressable style={styles.dropdown} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.userLabel} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={styles.separator} />
              {items.slice(0, 2).map((item) => (
                <Pressable key={item.key} style={styles.option} onPress={item.onPress}>
                  <Ionicons name={item.icon} size={18} color={ownerColors.text} />
                  <Text style={styles.optionLabel}>{t(item.labelKey)}</Text>
                </Pressable>
              ))}
              <View style={styles.separator} />
              <Pressable style={styles.option} onPress={items[2].onPress}>
                <Ionicons name={items[2].icon} size={18} color={ownerColors.danger} />
                <Text style={[styles.optionLabel, styles.optionDestructive]}>
                  {t(items[2].labelKey)}
                </Text>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ownerColors.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 56,
    paddingRight: 16,
  },
  dropdownWrap: { maxWidth: 220, width: "100%" },
  dropdown: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  userLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ownerColors.text,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ownerColors.border,
    marginVertical: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionLabel: { flex: 1, fontSize: 15, color: ownerColors.text },
  optionDestructive: { color: ownerColors.danger, fontWeight: "500" },
});
