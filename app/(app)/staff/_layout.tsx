import { Redirect, Stack, type Href } from "expo-router";

import { LoadingScreen } from "@/components/LoadingScreen";
import { useTenantContext } from "@/contexts/TenantContext";

export default function StaffLayout() {
  const { tenant, loading } = useTenantContext();

  if (loading) return <LoadingScreen />;
  if (!tenant) return <Redirect href={"/" as Href} />;

  // Receptionist has its own portal — keep staff routes staff-only
  if (tenant.role !== "staff") {
    return <Redirect href={"/" as Href} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
