import { Redirect, Stack, type Href } from 'expo-router';

import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuthContext } from "@/contexts/AuthContext";

export default function AppGroupLayout() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  return (
    <Stack>
      <Stack.Screen name="client" options={{ headerShown: false }} />
      <Stack.Screen name="owner" options={{ headerShown: false }} />
      <Stack.Screen name="staff/home" options={{ title: "Staff" }} />
      <Stack.Screen name="receptionist/home" options={{ title: "Reception" }} />
      <Stack.Screen name="partner/home" options={{ title: "Partner" }} />
    </Stack>
  );
}
