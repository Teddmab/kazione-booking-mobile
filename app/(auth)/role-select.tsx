import { type Href, useRouter } from "expo-router";
import { StyleSheet, Text, View, Pressable, ScrollView, SafeAreaView } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext, type TenantContextValue } from "@/contexts/TenantContext";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
  receptionist: "Receptionist",
};

function dashboardPath(role: string): Href {
  if (role === "owner" || role === "manager") return "/(app)/owner/(tabs)" as Href;
  if (role === "receptionist") return "/(app)/receptionist/home" as Href;
  return "/(app)/staff/home" as Href;
}

export default function RoleSelectScreen() {
  const router = useRouter();
  const { businesses, setActiveBusiness } = useTenantContext();

  const handleSelect = async (b: TenantContextValue) => {
    await setActiveBusiness(b.businessId);
    router.replace(dashboardPath(b.role));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Select your workspace</Text>
        <Text style={styles.subtitle}>Choose which role to sign in as today</Text>
        {businesses.map((b) => (
          <Pressable
            key={`${b.businessId}-${b.role}`}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => void handleSelect(b)}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.bizName}>{b.businessName}</Text>
              <Text style={styles.roleLabel}>{ROLE_LABELS[b.role] ?? b.role}</Text>
              {b.position ? <Text style={styles.position}>{b.position}</Text> : null}
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ownerColors.bg },
  container: { padding: 24, paddingTop: 48 },
  title: { fontSize: 26, fontWeight: "700", color: ownerColors.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: ownerColors.textMuted, marginBottom: 32 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  cardPressed: { opacity: 0.7 },
  cardLeft: { flex: 1 },
  bizName: { fontSize: 17, fontWeight: "600", color: ownerColors.text, marginBottom: 2 },
  roleLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: ownerColors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  position: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
  arrow: { fontSize: 22, color: ownerColors.textMuted },
});
