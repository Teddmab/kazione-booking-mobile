import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="check-email" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="create-business" options={{ title: 'Create Salon' }} />
    </Stack>
  );
}
