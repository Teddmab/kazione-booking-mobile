import { Redirect, Stack, type Href } from "expo-router";
import { View } from "react-native";

import { LoadingScreen } from "@/components/LoadingScreen";
import { StaffMoreSheet } from "@/components/staff/StaffMoreSheet";
import { useThemeColors } from "@/contexts/AppThemeContext";
import { StaffShellProvider } from "@/contexts/StaffShellContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useStaffPushRegistration } from "@/hooks/useStaffPushRegistration";
import { useStaffAppointmentsRealtime } from "@/hooks/useStaffRealtime";

export default function StaffLayout() {
  const { tenant, loading } = useTenantContext();
  const colors = useThemeColors();
  const isStaff = !!tenant && tenant.role === "staff";

  useStaffPushRegistration(isStaff);
  useStaffAppointmentsRealtime(
    isStaff ? tenant.businessId : "",
    isStaff ? (tenant.staffProfileId ?? "") : "",
  );

  if (loading) return <LoadingScreen />;
  if (!tenant) return <Redirect href={"/" as Href} />;

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
        </Stack>
        <StaffMoreSheet />
      </View>
    </StaffShellProvider>
  );
}
