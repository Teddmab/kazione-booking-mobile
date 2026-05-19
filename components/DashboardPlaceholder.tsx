import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { useAuthContext } from "@/contexts/AuthContext";

interface Props {
  title: string;
  subtitle: string;
}

export function DashboardPlaceholder({ title, subtitle }: Props) {
  const { signOut } = useAuthContext();
  const router = useRouter();

  const leave = async () => {
    await signOut();
    router.replace("/(auth)/welcome");
  };

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
      <Pressable style={styles.outline} onPress={() => void leave()}>
        <Text style={styles.outlineText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    gap: 12,
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "700" },
  sub: { fontSize: 15, color: "#555", lineHeight: 22 },
  outline: {
    marginTop: 24,
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6b5344",
  },
  outlineText: { color: "#6b5344", fontWeight: "600" },
});
