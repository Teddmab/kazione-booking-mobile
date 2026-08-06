import { Redirect, Stack, type Href } from "expo-router";
import { StyleSheet, View } from "react-native";

import { LoadingScreen } from "@/components/LoadingScreen";
import { StaffDrawer } from "@/components/staff/StaffDrawer";
import { StaffShellProvider } from "@/contexts/StaffShellContext";
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
    <StaffShellProvider>
      <View style={styles.flex}>
        <Stack screenOptions={{ headerShown: false }}>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
