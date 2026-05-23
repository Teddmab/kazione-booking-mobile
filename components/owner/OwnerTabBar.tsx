import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "react-i18next";

import { OWNER_BOTTOM_TABS } from "@/constants/ownerTabNav";
import { ownerColors } from "@/constants/ownerTheme";

export function OwnerTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const config = OWNER_BOTTOM_TABS.find((t) => t.name === route.name);
        const focused = state.index === index;
        const color = focused ? ownerColors.primary : ownerColors.textDim;
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
            <Text style={[styles.label, focused && styles.labelFocused]}>
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
    backgroundColor: ownerColors.tabBar,
    borderTopWidth: 1,
    borderTopColor: ownerColors.border,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  label: { fontSize: 11, color: ownerColors.textDim, fontWeight: "500" },
  labelFocused: { color: ownerColors.primary, fontWeight: "600" },
});
