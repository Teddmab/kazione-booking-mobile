import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { STAFF_MORE_PATH_MARKERS } from "@/constants/staffDrawerNav";
import { STAFF_BOTTOM_TABS } from "@/constants/staffTabNav";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors } from "@/contexts/AppThemeContext";
import { useStaffShell } from "@/contexts/StaffShellContext";

/** Hide tab bar on focused flows (e.g. training player). */
function shouldHideTabBar(pathname: string): boolean {
  const match = pathname.match(/\/training\/([^/]+)/);
  return Boolean(match && match[1] && match[1] !== "index");
}

function isMorePath(pathname: string): boolean {
  return STAFF_MORE_PATH_MARKERS.some(
    (marker) => marker !== "/more" && pathname.includes(marker),
  );
}

export function StaffTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const pathname = usePathname();
  const { openMore, moreOpen } = useStaffShell();

  if (shouldHideTabBar(pathname)) {
    return null;
  }

  const moreActive = moreOpen || isMorePath(pathname);

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
        const isMore = tab.name === "more";
        const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
        // More is sheet-only — no dedicated route required
        if (!isMore && routeIndex < 0) return null;
        const route = routeIndex >= 0 ? state.routes[routeIndex] : null;
        const focused = isMore
          ? moreActive
          : state.index === routeIndex && !moreActive;
        const color = focused ? colors.tabBarActive : colors.tabBarInactive;
        const iconName = focused ? tab.iconFocused : tab.icon;

        return (
          <Pressable
            key={tab.name}
            style={styles.tab}
            onPress={() => {
              if (isMore) {
                openMore();
                return;
              }
              if (!route) return;
              const e = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!e.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}>
            <Ionicons name={iconName} size={22} color={color} />
            <Text
              style={[styles.label, { color }, focused && styles.labelFocused]}
              numberOfLines={1}>
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
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    fontFamily: ownerFonts.medium,
  },
  labelFocused: {
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
});
