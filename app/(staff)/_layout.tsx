import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, type Href } from "expo-router";

import { LoadingScreen } from "@/components/LoadingScreen";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";

export default function StaffLayout() {
  const { tenant, loading } = useTenantContext();

  if (loading) {
    return <LoadingScreen message="Loading…" />;
  }

  if (!tenant || tenant.role !== "staff") {
    return <Redirect href={"/" as Href} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ownerColors.primary,
        tabBarInactiveTintColor: ownerColors.textMuted,
        tabBarStyle: {
          backgroundColor: ownerColors.card,
          borderTopColor: ownerColors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Appointments",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
