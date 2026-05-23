import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';

import {
  fetchUserRole,
  signOut as authSignOut,
} from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { useAuthStore, type UserRole } from '@/store/authStore';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: UserRole;
  isLoading: boolean;
  /** @deprecated Use isLoading */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function syncRoleForUser(userId: string) {
  try {
    const role = await fetchUserRole(userId);
    useAuthStore.getState().setRole(role);
  } catch {
    useAuthStore.getState().setRole(null);
  }
}

const SESSION_INIT_TIMEOUT_MS = 12_000;

type SessionResult = Awaited<ReturnType<ReturnType<typeof getSupabase>['auth']['getSession']>>;

async function getSessionSafe(): Promise<SessionResult> {
  const timeout = new Promise<SessionResult>((resolve) => {
    setTimeout(
      () => resolve({ data: { session: null }, error: null }),
      SESSION_INIT_TIMEOUT_MS,
    );
  });
  return Promise.race([getSupabase().auth.getSession(), timeout]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        const { data } = await getSessionSafe();
        if (!mounted) return;
        setSession(data.session);
        if (data.session?.user) {
          void syncRoleForUser(data.session.user.id);
        }
      } catch {
        // ignore — onAuthStateChange will drive state once the client is ready
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      try {
        if (event === 'SIGNED_OUT') {
          clearSession();
          queryClient.clear();
          return;
        }

        setSession(nextSession);

        if (event === 'SIGNED_IN' && nextSession?.user) {
          await syncRoleForUser(nextSession.user.id);
        }

        if (event === 'TOKEN_REFRESHED' && nextSession) {
          setSession(nextSession);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearSession, queryClient, setLoading, setSession]);

  const signOut = useCallback(async () => {
    setLoading(true);
    await authSignOut();
    clearSession();
    queryClient.clear();
    setLoading(false);
  }, [clearSession, queryClient, setLoading]);

  return (
    <AuthContext.Provider
      value={{ user, session, role, isLoading, loading: isLoading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** @deprecated Use useAuth */
export const useAuthContext = useAuth;
