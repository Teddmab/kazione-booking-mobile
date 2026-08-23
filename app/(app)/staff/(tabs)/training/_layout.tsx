import { Stack } from "expo-router";

import { useThemeColors } from "@/contexts/AppThemeContext";

export default function StaffTrainingLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
