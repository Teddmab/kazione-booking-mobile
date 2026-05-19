import { Stack } from "expo-router";

export default function ClientStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Discover" }} />
      <Stack.Screen name="browse" options={{ title: "Browse salons" }} />
      <Stack.Screen name="salon/[slug]" options={{ title: "Salon" }} />
      <Stack.Screen name="book/[slug]" options={{ title: "Book" }} />
      <Stack.Screen name="bookings" options={{ title: "My bookings" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
    </Stack>
  );
}
