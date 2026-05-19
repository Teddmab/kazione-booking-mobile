import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

const missingSupabaseEnvMessage =
  "Missing Supabase configuration: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in `.env` (see `.env.example`), then restart Expo.";

function createConfiguredClient(): SupabaseClient {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(missingSupabaseEnvMessage);
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

let singleton: SupabaseClient | undefined;

/**
 * Builds the Supabase client on first use so missing `.env` does not crash expo-router module loading.
 * Throws a clear error if `EXPO_PUBLIC_SUPABASE_*` vars are absent.
 */
export function getSupabase(): SupabaseClient {
  singleton ??= createConfiguredClient();
  return singleton;
}
