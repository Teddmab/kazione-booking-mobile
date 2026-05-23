import { Tabs } from "expo-router";

import { OwnerTabBar } from "@/components/owner/OwnerTabBar";
import { ownerColors } from "@/constants/ownerTheme";

export default function OwnerTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <OwnerTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: ownerColors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen name="appointments" options={{ title: "RDV" }} />
      <Tabs.Screen name="clients" options={{ title: "Clients" }} />
      <Tabs.Screen name="more" options={{ title: "Plus" }} />
    </Tabs>
  );
}
