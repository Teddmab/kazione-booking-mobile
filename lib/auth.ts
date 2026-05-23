import * as Linking from 'expo-linking';

import { api } from '@/lib/api';
import { getSupabase } from '@/lib/supabase';
import type { UserRole } from '@/store/authStore';

interface MeRoleResponse {
  tenant?: { role?: string } | null;
}

const redirectUrl = Linking.createURL('/');

export async function signInWithEmail(email: string, password: string) {
  return getSupabase().auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  language?: string,
) {
  return getSupabase().auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, language: language ?? 'en' },
      emailRedirectTo: redirectUrl,
    },
  });
}

export async function signInWithGoogle() {
  return getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'kazione://auth/callback' },
  });
}

export async function signOut() {
  return getSupabase().auth.signOut();
}

export async function resetPassword(email: string) {
  return getSupabase().auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
}

/** Resolves app role via GET /me (Edge Function), not direct Supabase DB access. */
export async function fetchUserRole(_userId: string): Promise<UserRole> {
  try {
    const me = await api.get<MeRoleResponse>('/me');
    const role = me.tenant?.role;
    if (role === 'owner' || role === 'manager' || role === 'staff') {
      return role;
    }
    return 'client';
  } catch {
    return 'client';
  }
}

/** @deprecated Prefer named exports; kept for existing screens. */
export const authClient = {
  signIn: signInWithEmail,
  signOut: (options?: { scope?: 'global' | 'local' | 'others' }) =>
    getSupabase().auth.signOut(options),
  getSession: () => getSupabase().auth.getSession(),
  getUser: () => getSupabase().auth.getUser(),
  signUp: (email: string, password: string) => signUpWithEmail(email, password, ''),
  resetPasswordForEmail: resetPassword,
  updatePassword: (newPassword: string) =>
    getSupabase().auth.updateUser({ password: newPassword }),
  exchangeCodeForSession: (code: string) =>
    getSupabase().auth.exchangeCodeForSession(code),
  onAuthStateChange: (
    cb: Parameters<ReturnType<typeof getSupabase>['auth']['onAuthStateChange']>[0],
  ) => getSupabase().auth.onAuthStateChange(cb),
};
