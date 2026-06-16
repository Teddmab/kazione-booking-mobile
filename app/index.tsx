import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";

import { ClientNotAllowed } from "@/components/ClientNotAllowed";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ONBOARDING_STORAGE_KEY } from "@/constants/onboarding";
import { ownerColors } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { tenantQueryKey, useTenantContext } from "@/contexts/TenantContext";
import { ApiError } from "@/lib/api";

function dashboardPathForTenant(
  role: string,
): "/(app)/owner/(tabs)" | "/(app)/staff/home" | "/(app)/receptionist/home" {
  if (role === "owner" || role === "manager") return "/(app)/owner/(tabs)";
  if (role === "receptionist") return "/(app)/receptionist/home";
  return "/(app)/staff/home";
}

function workspaceErrorHint(err: Error): string {
  if (err instanceof ApiError && err.code === "NETWORK_ERROR") {
    return "Le backend est injoignable. Lancez Supabase (`supabase start`) puis les Edge Functions (`cd kazione-booking-backend && npm run dev`). Sur téléphone physique, utilisez l’IP LAN du PC dans `.env` (pas 127.0.0.1).";
  }
  if (err instanceof ApiError && err.code === "MISCONFIGURATION") {
    return "Ajoutez EXPO_PUBLIC_API_BASE_URL dans .env puis redémarrez Expo.";
  }
  if (
    err.message.includes("upstream") ||
    err.message.includes("name resolution") ||
    err.message.includes("503") ||
    err.message.includes("502")
  ) {
    return "Les Edge Functions ne répondent pas. Dans kazione-booking-backend : `npm run dev` (ou redémarrez `supabase_edge_runtime`).";
  }
  return err.message;
}

export default function Index() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, role, signOut } = useAuthContext();
  const { tenant, businesses, loading: tenantLoading, error: tenantError } = useTenantContext();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY).then((v) => {
      setOnboardingDone(v === "1");
    });
  }, []);

  if (authLoading || onboardingDone === null) {
    return <LoadingScreen message="Chargement…" />;
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  if (!user) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  if (tenantLoading) {
    return <LoadingScreen message="Espace de travail…" />;
  }

  if (tenantError) {
    if (tenantError instanceof ApiError && tenantError.code === "UNAUTHORIZED") {
      return <Redirect href="/(auth)/welcome" />;
    }
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorTitle}>Impossible de charger l&apos;espace de travail</Text>
        <Text style={styles.errorMsg}>{workspaceErrorHint(tenantError)}</Text>
        <Pressable
          style={styles.retryBtn}
          onPress={() =>
            void queryClient.invalidateQueries({ queryKey: tenantQueryKey(user?.id) })
          }>
          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  if (!tenant) {
    if (role === "client" || role === null) {
      return (
        <ClientNotAllowed
          onSignOut={() => {
            void signOut().then(() => router.replace("/(auth)/login" as Href));
          }}
        />
      );
    }
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorTitle}>Aucun salon associé</Text>
        <Text style={styles.errorMsg}>
          Ce compte n&apos;est lié à aucun établissement. Connectez-vous avec un compte owner ou staff.
        </Text>
        <Pressable
          style={styles.retryBtn}
          onPress={() => {
            void signOut().then(() => router.replace("/(auth)/welcome" as Href));
          }}>
          <Text style={styles.retryText}>Retour à la connexion</Text>
        </Pressable>
      </View>
    );
  }

  if (businesses.length > 1) {
    return <Redirect href={"/(auth)/role-select" as Href} />;
  }

  return <Redirect href={dashboardPathForTenant(tenant.role) as Href} />;
}

const styles = StyleSheet.create({
  errorBox: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: ownerColors.bg,
  },
  errorTitle: { fontSize: 20, fontWeight: "700", color: ownerColors.text, marginBottom: 8 },
  errorMsg: { fontSize: 15, lineHeight: 22, color: ownerColors.textMuted, marginBottom: 16 },
  retryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: "center",
  },
  retryText: { color: "#fff", fontWeight: "600" },
});
