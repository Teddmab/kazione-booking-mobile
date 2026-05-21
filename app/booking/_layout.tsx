import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { COLORS, TYPOGRAPHY } from '@/constants/tokens';

function BookingHeader() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
      </Pressable>
      <Text style={styles.title}>KaziOne</Text>
      <View style={styles.spacer} />
    </View>
  );
}

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <BookingHeader />,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="staff" />
      <Stack.Screen name="datetime" />
      <Stack.Screen name="details" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="confirmation" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.gold,
  },
  spacer: { width: 24 },
});
