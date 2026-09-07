import { useSegments, useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { isCustomerRoute } from '@/lib/appScope';

/** Auth screens a signed-in user may stay on (workspace picker, etc.). */
const SESSION_ALLOWED_AUTH = new Set(['role-select']);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const rootSegment = segments[0] as string | undefined;
  const authLeaf = segments[1] as string | undefined;
  const inAuthGroup = rootSegment === '(auth)';
  const onCustomerRoute = isCustomerRoute(segments);
  const allowAuthWithSession =
    inAuthGroup && !!authLeaf && SESSION_ALLOWED_AUTH.has(authLeaf);

  useEffect(() => {
    if (isLoading) return;

    if (!session && !inAuthGroup && onCustomerRoute) {
      router.replace('/(auth)/login' as Href);
      return;
    }

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login' as Href);
      return;
    }

    if (session && onCustomerRoute) {
      router.replace('/' as Href);
      return;
    }

    // Signed-in users leave auth screens — except workspace selection.
    if (session && inAuthGroup && !allowAuthWithSession) {
      router.replace('/' as Href);
    }
  }, [
    session,
    isLoading,
    inAuthGroup,
    onCustomerRoute,
    allowAuthWithSession,
    router,
  ]);

  if (isLoading) {
    return <LoadingSpinner message="Loading…" />;
  }

  return <>{children}</>;
}
