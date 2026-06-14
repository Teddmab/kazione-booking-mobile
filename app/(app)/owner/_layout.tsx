import { Redirect, Stack } from "expo-router";
import { View, StyleSheet } from "react-native";

import { OwnerDrawer } from "@/components/owner/OwnerDrawer";
import { LoadingScreen } from "@/components/LoadingScreen";
import { OwnerShellProvider } from "@/contexts/OwnerShellContext";
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
    return <Redirect href="/" />;
  }

  const role = tenant.role;
  if (role !== "owner" && role !== "manager") {
    return <Redirect href="/" />;
  }

  return (
    <OwnerShellProvider>
      <View style={styles.flex}>
        <Stack
          screenOptions={{
            headerBackTitle: "Retour",
            headerTintColor: "#6b5344",
            headerStyle: { backgroundColor: "#f9f8f3" },
            contentStyle: { backgroundColor: "#f9f8f3" },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="walk-in" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="staff" options={{ headerShown: false }} />
          <Stack.Screen name="services" options={{ headerShown: false }} />
          <Stack.Screen name="storefront" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="finance" options={{ headerShown: false }} />
          <Stack.Screen name="reports" options={{ headerShown: false }} />
          <Stack.Screen name="suppliers" options={{ headerShown: false }} />
          <Stack.Screen name="marketplace" options={{ headerShown: false }} />
          <Stack.Screen name="ai-insights" options={{ headerShown: false }} />
          <Stack.Screen name="more" options={{ title: "Plus", headerShown: false }} />
        </Stack>
        <OwnerDrawer />
      </View>
    </OwnerShellProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
