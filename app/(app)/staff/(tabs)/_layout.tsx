import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { StaffTabBar } from "@/components/staff/StaffTabBar";
import { useThemeColors } from "@/contexts/AppThemeContext";

export default function StaffTabsLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Tabs
      tabBar={(props) => <StaffTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="today" options={{ title: t("staffNav.today") }} />
      <Tabs.Screen name="calendar" options={{ title: t("staffNav.calendar") }} />
      <Tabs.Screen name="services" options={{ title: t("sidebar.services") }} />
      <Tabs.Screen name="performance" options={{ title: t("staffNav.performance") }} />
    </Tabs>
  );
}
