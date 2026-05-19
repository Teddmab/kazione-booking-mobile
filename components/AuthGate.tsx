import { useSegments, useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import { useAuth } from '@/contexts/AuthContext';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading, role } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const rootSegment = segments[0] as string | undefined;
  const inAuthGroup = rootSegment === '(auth)';

  useEffect(() => {
    if (isLoading) return;

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login' as Href);
      return;
    }

    if (session && inAuthGroup) {
      router.replace('/(tabs)' as Href);
    }
  }, [session, isLoading, inAuthGroup, router]);

  if (isLoading) {
    return <LoadingSpinner message="Loading…" />;
  }

  const showOwnerNotice =
    session && (role === 'owner' || role === 'manager') && rootSegment === '(tabs)';

  return (
    <>
      {showOwnerNotice ? (
        <View style={styles.ownerBanner}>
          <Text style={styles.ownerText}>
            Dashboard available on web at kazione.app — mobile is optimised for client bookings.
          </Text>
        </View>
      ) : null}
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  ownerBanner: {
    backgroundColor: COLORS.elevated,
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ownerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.goldLight,
    textAlign: 'center',
  },
});
