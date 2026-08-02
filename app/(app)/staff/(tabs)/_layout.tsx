import { Tabs } from "expo-router";

import { StaffTabBar } from "@/components/staff/StaffTabBar";
import { ownerColors } from "@/constants/ownerTheme";

export default function StaffTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <StaffTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: ownerColors.bg },
      }}>
      <Tabs.Screen name="today" options={{ title: "Aujourd'hui" }} />
      <Tabs.Screen name="calendar" options={{ title: "Agenda" }} />
      <Tabs.Screen name="history" options={{ title: "Historique" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}
