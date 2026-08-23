import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { STAFF_BOTTOM_TABS } from "@/constants/staffTabNav";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors } from "@/contexts/AppThemeContext";

/** Hide tab bar on focused flows (e.g. training player). */
function shouldHideTabBar(pathname: string): boolean {
  // /staff/training/<redemptionId> — keep bar on /staff/training list
  const match = pathname.match(/\/training\/([^/]+)/);
  return Boolean(match && match[1] && match[1] !== "index");
}

export function StaffTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const pathname = usePathname();

  if (shouldHideTabBar(pathname)) {
    return null;
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
        },
      ]}>
      {STAFF_BOTTOM_TABS.map((tab) => {
        const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
        if (routeIndex < 0) return null;
        const route = state.routes[routeIndex];
        const focused = state.index === routeIndex;
        const color = focused ? colors.tabBarActive : colors.tabBarInactive;
        const iconName = focused ? tab.iconFocused : tab.icon;

        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={() => {
              const e = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !e.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}>
            <Ionicons name={iconName} size={22} color={color} />
            <Text style={[styles.label, { color }, focused && styles.labelFocused]}>
              {t(tab.titleKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  label: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: ownerFonts.medium,
  },
  labelFocused: {
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
});
