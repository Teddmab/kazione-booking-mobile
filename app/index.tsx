import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect, useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";

import { ClientNotAllowed } from "@/components/ClientNotAllowed";
import { LoadingScreen } from "@/components/LoadingScreen";
import { staffWelcomeStorageKey } from "@/constants/staffWelcome";
import { ownerColors } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { tenantQueryKey, useTenantContext } from "@/contexts/TenantContext";
import { ApiError } from "@/lib/api";
import {
  isStaffMembership,
  workspaceRouteForTenant,
} from "@/lib/workspaceRouting";

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
  const { user, loading: authLoading, signOut } = useAuthContext();
  const {
    tenant,
    businesses,
    loading: tenantLoading,
    error: tenantError,
  } = useTenantContext();
  const [staffWelcomeDone, setStaffWelcomeDone] = useState<boolean | null>(null);

  const staffMemberships = useMemo(
    () => businesses.filter((b) => isStaffMembership(b.role)),
    [businesses],
  );

  const goLogin = () => {
    void signOut().then(() => router.replace("/(auth)/login" as Href));
  };

  useEffect(() => {
    if (!user?.id || tenant?.role !== "staff") {
      setStaffWelcomeDone(true);
      return;
    }
    let cancelled = false;
    setStaffWelcomeDone(null);
    void AsyncStorage.getItem(staffWelcomeStorageKey(user.id)).then((v) => {
      if (!cancelled) setStaffWelcomeDone(v === "1");
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, tenant?.role]);

  if (authLoading) {
    return <LoadingScreen message="Chargement…" />;
  }

  if (!user) {
    return <Redirect href={"/(auth)/login" as Href} />;
  }

  if (tenantLoading) {
    return <LoadingScreen message="Espace de travail…" />;
  }

  if (tenantError) {
    if (tenantError instanceof ApiError && tenantError.code === "UNAUTHORIZED") {
      return <Redirect href={"/(auth)/login" as Href} />;
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

  if (staffMemberships.length === 0) {
    return <ClientNotAllowed onSignOut={goLogin} />;
  }

  // Multi-workspace without an active staff tenant → picker (AuthGate allows this screen).
  if (staffMemberships.length > 1 && (!tenant || !isStaffMembership(tenant.role))) {
    return <Redirect href={"/(auth)/role-select" as Href} />;
  }

  if (!tenant || !isStaffMembership(tenant.role)) {
    return <ClientNotAllowed onSignOut={goLogin} />;
  }

  if (staffWelcomeDone === null) {
    return <LoadingScreen message="Chargement…" />;
  }
  if (!staffWelcomeDone) {
    return <Redirect href={"/(app)/staff/welcome" as Href} />;
  }

  return <Redirect href={workspaceRouteForTenant(tenant) as Href} />;
}

const styles = StyleSheet.create({
  errorBox: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: ownerColors.bg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: ownerColors.text,
    marginBottom: 8,
  },
  errorMsg: {
    fontSize: 15,
    lineHeight: 22,
    color: ownerColors.textMuted,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: "center",
  },
  retryText: { color: "#fff", fontWeight: "600" },
});
