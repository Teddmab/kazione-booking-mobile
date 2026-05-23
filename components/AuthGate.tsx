import { useSegments, useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
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
      // Let app/index.tsx handle role-based routing
      router.replace('/' as Href);
    }
  }, [session, isLoading, inAuthGroup, router]);

  if (isLoading) {
    return <LoadingSpinner message="Loading…" />;
  }

  return <>{children}</>;
}
