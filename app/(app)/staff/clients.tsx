import { StyleSheet, Text, View } from "react-native";

import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";

/** Placeholder — clients staff (parité web /staff/clients) */
export default function StaffClientsScreen() {
  return (
    <View style={ownerStyles.screen}>
      <StaffAppBar title="Clients" subtitle="Bientôt disponible" displayTitle />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Mes clients</Text>
          <Text style={styles.sub}>
            La liste clients staff (fréquents, récurrents, nouveaux) arrivera
            dans un prochain sprint.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 16 },
  card: {
    ...ownerStyles.card,
    backgroundColor: ownerColors.primarySurface,
    alignItems: "center",
    paddingVertical: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  sub: {
    fontSize: 14,
    color: ownerColors.textMuted,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: ownerFonts.regular,
  },
});
