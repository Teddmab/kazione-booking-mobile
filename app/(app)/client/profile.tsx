import { View, Text, StyleSheet } from "react-native";

import { useAuthContext } from "@/contexts/AuthContext";

/** Phase 3 — profile edit parity with web client profile. */
export default function ClientProfilePlaceholder() {
  const { user } = useAuthContext();

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.label}>Signed in as</Text>
      <Text style={styles.email}>{user?.email ?? "—"}</Text>
      <Text style={styles.body}>
        Editable profile fields will be added in Phase 3 (docs/MOBILE_ROADMAP.md).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 13, color: "#888", textTransform: "uppercase" },
  email: { fontSize: 16, fontWeight: "600", marginTop: 4, marginBottom: 20 },
  body: { fontSize: 15, lineHeight: 22, color: "#555" },
});
