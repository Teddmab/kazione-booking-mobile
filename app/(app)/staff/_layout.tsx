import { Redirect, Stack, type Href } from "expo-router";
import { View } from "react-native";

import { LoadingScreen } from "@/components/LoadingScreen";
import { StaffDrawer } from "@/components/staff/StaffDrawer";
import { useThemeColors } from "@/contexts/AppThemeContext";
import { StaffShellProvider } from "@/contexts/StaffShellContext";
import { useTenantContext } from "@/contexts/TenantContext";

export default function StaffLayout() {
  const { tenant, loading } = useTenantContext();
  const colors = useThemeColors();

  if (loading) return <LoadingScreen />;
  if (!tenant) return <Redirect href={"/" as Href} />;

  // Receptionist has its own portal — keep staff routes staff-only
  if (tenant.role !== "staff") {
    return <Redirect href={"/" as Href} />;
  }

  return (
    <StaffShellProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="clients" />
          <Stack.Screen name="reviews" />
          <Stack.Screen name="notifications" />
        </Stack>
        <StaffDrawer />
      </View>
    </StaffShellProvider>
  );
}
