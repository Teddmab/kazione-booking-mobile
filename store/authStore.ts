import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type UserRole = 'client' | 'owner' | 'manager' | 'staff' | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  setRole: (role: UserRole) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      role: null,
      isLoading: true,
      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
        }),
      clearSession: () =>
        set({
          session: null,
          user: null,
          role: null,
          isLoading: false,
        }),
      setRole: (role) => set({ role }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'kazione-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        role: state.role,
      }),
    },
  ),
);
