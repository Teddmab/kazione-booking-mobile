import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { LoadingScreen } from "@/components/LoadingScreen";
import { ONBOARDING_STORAGE_KEY } from "@/constants/onboarding";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { ApiError } from "@/lib/api";

function dashboardPathForTenant(
  role: string,
): "/(app)/owner/" | "/(app)/staff/home" | "/(app)/receptionist/home" {
  if (role === "owner" || role === "manager") return "/(app)/owner/";
  if (role === "receptionist") return "/(app)/receptionist/home";
  return "/(app)/staff/home";
}

export default function Index() {
  const { user, loading: authLoading } = useAuthContext();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenantContext();
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
        <Text style={styles.errorTitle}>Could not load workspace</Text>
        <Text style={styles.errorMsg}>{tenantError.message}</Text>
      </View>
    );
  }

  if (!tenant) {
    return <Redirect href={'/(tabs)' as Href} />;
  }

  return <Redirect href={dashboardPathForTenant(tenant.role) as Href} />;
}

const styles = StyleSheet.create({
  errorBox: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  errorTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  errorMsg: { color: "#555", marginBottom: 16 },
});
