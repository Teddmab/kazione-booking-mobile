import { Redirect, Stack, type Href } from "expo-router";

import { LoadingScreen } from "@/components/LoadingScreen";
import { useTenantContext } from "@/contexts/TenantContext";

export default function StaffLayout() {
  const { tenant, loading } = useTenantContext();

  if (loading) return <LoadingScreen />;
  if (!tenant) return <Redirect href={"/" as Href} />;

  const role = tenant.role;
  if (role !== "staff" && role !== "receptionist") {
    return <Redirect href={"/" as Href} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
