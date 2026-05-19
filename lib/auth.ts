import * as Linking from 'expo-linking';

import { getSupabase } from '@/lib/supabase';
import type { UserRole } from '@/store/authStore';

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

export async function fetchUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await getSupabase()
    .from('business_members')
    .select('role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.role) {
    return 'client';
  }

  const role = data.role as string;
  if (role === 'owner' || role === 'manager' || role === 'staff') {
    return role;
  }
  return 'client';
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
