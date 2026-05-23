import { Redirect, Stack } from "expo-router";

import { LoadingScreen } from "@/components/LoadingScreen";
import { NotificationBell } from "@/components/owner/NotificationBell";
import { useTenantContext } from "@/contexts/TenantContext";

export default function OwnerLayout() {
  const { tenant, loading, error } = useTenantContext();

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <Redirect href="/" />;
  }

  if (!tenant) {
    return <Redirect href="/(app)/client" />;
  }

  const role = tenant.role;
  if (role !== "owner" && role !== "manager") {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Retour",
        headerTintColor: "#6b5344",
        headerStyle: { backgroundColor: "#faf8f5" },
        contentStyle: { backgroundColor: "#faf8f5" },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="appointments"
        options={{ title: "Rendez-vous", headerRight: () => <NotificationBell /> }}
      />
      <Stack.Screen name="walk-in" options={{ title: "Passage rapide" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="clients" options={{ title: "Clients" }} />
      <Stack.Screen name="staff" options={{ title: "Équipe" }} />
      <Stack.Screen name="services" options={{ title: "Services" }} />
      <Stack.Screen name="storefront" options={{ title: "Vitrine" }} />
      <Stack.Screen name="settings" options={{ title: "Paramètres" }} />
      <Stack.Screen name="more" options={{ title: "Plus" }} />
    </Stack>
  );
}
