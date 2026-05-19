import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";

import { QueryState } from "@/components/owner/QueryState";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerBusiness } from "@/hooks/useOwnerBusiness";

export default function OwnerSettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthContext();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const { data: business, isLoading, isError, error, refetch, isRefetching } =
    useOwnerBusiness(businessId);

  const leave = async () => {
    await signOut();
    router.replace("/(auth)/welcome");
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
      }>
      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        onRetry={() => void refetch()}>
        <Text style={styles.section}>Salon</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Nom</Text>
          <Text style={styles.value}>{business?.name ?? tenant?.businessName ?? "—"}</Text>
          {business?.business_type ? (
            <>
              <Text style={[styles.label, styles.labelSpaced]}>Type</Text>
              <Text style={styles.value}>{business.business_type}</Text>
            </>
          ) : null}
          {business?.country ? (
            <>
              <Text style={[styles.label, styles.labelSpaced]}>Pays</Text>
              <Text style={styles.value}>{business.country}</Text>
            </>
          ) : null}
        </View>

        <Text style={styles.section}>Compte</Text>
        <View style={styles.card}>
          <Text style={styles.label}>E-mail</Text>
          <Text style={styles.value}>{user?.email ?? "—"}</Text>
          <Text style={[styles.label, styles.labelSpaced]}>Rôle</Text>
          <Text style={styles.value}>
            {tenant?.role === "manager" ? "Gérant" : "Propriétaire"}
          </Text>
        </View>

        <Text style={styles.hint}>
          Stripe, PayPal, horaires et notifications : configurez-les sur la version web
          (Paramètres).
        </Text>

        <Pressable style={ownerStyles.outlineBtn} onPress={() => void leave()}>
          <Text style={ownerStyles.outlineBtnText}>Se déconnecter</Text>
        </Pressable>
      </QueryState>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  section: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
    marginBottom: 16,
  },
  label: { fontSize: 12, color: ownerColors.textDim },
  labelSpaced: { marginTop: 14 },
  value: { fontSize: 16, color: ownerColors.text, marginTop: 4, fontWeight: "500" },
  hint: {
    fontSize: 13,
    color: ownerColors.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
});
