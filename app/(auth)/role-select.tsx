import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingScreen } from "@/components/LoadingScreen";
import { ownerColors } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext, type TenantContextValue } from "@/contexts/TenantContext";
import { roleLabel, workspaceRouteForMembership } from "@/lib/workspaceRouting";

export default function RoleSelectScreen() {
  const router = useRouter();
  const { signOut } = useAuthContext();
  const { businesses, selectMembership, loading, needsRoleSelection } = useTenantContext();

  if (loading) {
    return <LoadingScreen message="Loading workspaces…" />;
  }

  if (!needsRoleSelection && businesses.length <= 1) {
    return <LoadingScreen message="Redirecting…" />;
  }

  const onSelect = async (membership: TenantContextValue) => {
    await selectMembership(membership);
    router.replace(workspaceRouteForMembership(membership.role) as Href);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Select your workspace</Text>
        <Text style={styles.subtitle}>Choose where you want to work today.</Text>
      </View>

      <FlatList
        data={businesses}
        keyExtractor={(item) => item.businessId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => void onSelect(item)}>
            <View style={styles.iconWrap}>
              <Ionicons name="business-outline" size={22} color={ownerColors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.businessName}>{item.businessName}</Text>
              <Text style={styles.roleLabel}>{roleLabel(item.role, item.position)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={ownerColors.textMuted} />
          </Pressable>
        )}
      />

      <Pressable
        style={styles.signOut}
        onPress={() => {
          void signOut().then(() => router.replace("/(auth)/login" as Href));
        }}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ownerColors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", color: ownerColors.text },
  subtitle: { fontSize: 15, color: ownerColors.textMuted, marginTop: 6 },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ownerColors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, minWidth: 0 },
  businessName: { fontSize: 17, fontWeight: "600", color: ownerColors.text },
  roleLabel: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
  signOut: { alignItems: "center", paddingVertical: 20 },
  signOutText: { fontSize: 15, fontWeight: "600", color: ownerColors.primary },
});
