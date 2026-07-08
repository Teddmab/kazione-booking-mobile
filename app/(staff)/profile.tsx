import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ownerColors } from "@/constants/ownerTheme";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenantContext } from "@/contexts/TenantContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { roleLabel } from "@/lib/workspaceRouting";

export default function StaffProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuthContext();
  const { tenant, clearActiveBusiness } = useTenantContext();
  const { data: profile } = useUserProfile();

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "—";
  const email = profile?.email ?? "—";

  const switchWorkspace = async () => {
    await clearActiveBusiness();
    router.replace("/(auth)/role-select" as Href);
  };

  const logout = async () => {
    await signOut();
    router.replace("/(auth)/login" as Href);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.name}>{fullName}</Text>
        {tenant?.position ? <Text style={styles.position}>{tenant.position}</Text> : null}
        <Text style={styles.meta}>{roleLabel(tenant?.role ?? "staff", tenant?.position)}</Text>
        <Text style={styles.meta}>{tenant?.businessName}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <Pressable style={styles.btn} onPress={() => void switchWorkspace()}>
        <Text style={styles.btnText}>Switch workspace</Text>
      </Pressable>

      <Pressable style={[styles.btn, styles.btnDanger]} onPress={() => void logout()}>
        <Text style={[styles.btnText, styles.btnDangerText]}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ownerColors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: ownerColors.text },
  card: {
    marginHorizontal: 16,
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
    gap: 4,
  },
  name: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  position: { fontSize: 15, fontWeight: "600", color: ownerColors.primary },
  meta: { fontSize: 14, color: ownerColors.textMuted },
  email: { fontSize: 14, color: ownerColors.text, marginTop: 8 },
  btn: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    alignItems: "center",
  },
  btnText: { fontSize: 15, fontWeight: "600", color: ownerColors.primary },
  btnDanger: { borderColor: ownerColors.danger },
  btnDangerText: { color: ownerColors.danger },
});
