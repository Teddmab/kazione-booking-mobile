import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { fetchTenantBootstrap, tenantQueryKey } from '@/contexts/TenantContext';
import { ApiError } from '@/lib/api';
import { authClient } from '@/lib/auth';

function isCredentialError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('invalid login') ||
    m.includes('invalid credentials') ||
    m.includes('email not confirmed')
  );
}

export function useAuthLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      try {
        const { error: signErr } = await authClient.signIn(email.trim(), password);
        if (signErr) {
          setError(
            isCredentialError(signErr.message)
              ? t('auth.invalidCredentials')
              : signErr.message,
          );
          return;
        }

        const { data: sessionData } = await authClient.getSession();
        const userId = sessionData.session?.user?.id;
        if (userId) {
          try {
            await queryClient.fetchQuery({
              queryKey: tenantQueryKey(userId),
              queryFn: fetchTenantBootstrap,
              staleTime: 0,
            });
          } catch (err) {
            const msg =
              err instanceof ApiError && err.code === 'NETWORK_ERROR'
                ? t('auth.networkError')
                : err instanceof Error
                  ? err.message
                  : t('common.error');
            setError(msg);
            return;
          }
        }

        router.replace('/');
      } finally {
        setLoading(false);
      }
    },
    [queryClient, router, t],
  );

  return { submit, loading, error, setError };
}
