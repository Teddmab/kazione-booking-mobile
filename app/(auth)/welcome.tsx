import { Link } from "expo-router";
import { View, Text, StyleSheet, Pressable } from "react-native";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Kazione</Text>
      <Text style={styles.tagline}>Booking on the go</Text>
      <Text style={styles.hint}>Use the same account as on the web.</Text>

      <Link href="/(auth)/login-client" asChild>
        <Pressable style={styles.primary}>
          <Text style={styles.primaryText}>I am a client</Text>
        </Pressable>
      </Link>

      <Link href="/(auth)/login-team" asChild>
        <Pressable style={styles.secondary}>
          <Text style={styles.secondaryText}>Salon staff / owner</Text>
        </Pressable>
      </Link>

      <Link href="/(auth)/signup" asChild>
        <Pressable style={styles.linkWrap}>
          <Text style={styles.link}>Create an account</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#faf8f5",
    gap: 12,
  },
  logo: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  tagline: { fontSize: 17, color: "#555" },
  hint: { fontSize: 14, color: "#888", marginBottom: 24 },
  primary: {
    backgroundColor: "#6b5344",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondary: {
    borderWidth: 1,
    borderColor: "#6b5344",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#6b5344", fontSize: 16, fontWeight: "600" },
  linkWrap: { paddingVertical: 12, alignItems: "center" },
  link: { color: "#6b5344", fontSize: 15, fontWeight: "500" },
});
