import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { STAFF_BOTTOM_TABS } from "@/constants/staffTabNav";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors } from "@/contexts/AppThemeContext";

export function StaffTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useThemeColors();

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
      {state.routes.map((route, index) => {
        const config = STAFF_BOTTOM_TABS.find((tab) => tab.name === route.name);
        const focused = state.index === index;
        const color = focused ? colors.tabBarActive : colors.tabBarInactive;
        const iconName = focused ? config?.iconFocused : config?.icon;

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
            <Ionicons name={iconName ?? "ellipse"} size={22} color={color} />
            <Text style={[styles.label, { color }, focused && styles.labelFocused]}>
              {config ? t(config.titleKey) : route.name}
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
