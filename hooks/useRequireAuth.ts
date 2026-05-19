import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

export function useRequireAuth() {
  const { user, role, session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/(auth)/login' as Href);
    }
  }, [isLoading, session, router]);

  return { user, role, isLoading };
}
