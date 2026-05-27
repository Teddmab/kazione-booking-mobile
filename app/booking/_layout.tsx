import { Stack } from 'expo-router';

import { COLORS } from '@/constants/tokens';

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        gestureEnabled: true,
      }}>
      <Stack.Screen name="staff" />
      <Stack.Screen name="datetime" />
      <Stack.Screen name="details" />
      <Stack.Screen name="summary" />
      <Stack.Screen
        name="confirmation"
        options={{ gestureEnabled: false }}
      />
    </Stack>
  );
}
