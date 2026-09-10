import { Redirect, Stack, type Href } from 'expo-router';
import { View } from 'react-native';

import { LoadingScreen } from "@/components/LoadingScreen";
import { WorkspaceSwitchSheet } from "@/components/WorkspaceSwitchSheet";
import { useAuthContext } from "@/contexts/AuthContext";
import { WorkspaceSwitchProvider } from "@/contexts/WorkspaceSwitchContext";

export default function AppGroupLayout() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  return (
    <WorkspaceSwitchProvider>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="owner" options={{ headerShown: false }} />
          <Stack.Screen name="staff" options={{ headerShown: false }} />
          <Stack.Screen name="receptionist/home" options={{ title: "Reception" }} />
        </Stack>
        <WorkspaceSwitchSheet />
      </View>
    </WorkspaceSwitchProvider>
  );
}
