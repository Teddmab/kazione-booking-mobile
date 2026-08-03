import { StyleSheet, Text, View } from "react-native";

import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";

/** Placeholder — implémenté en MS4 */
export default function StaffServicesScreen() {
  return (
    <View style={ownerStyles.screen}>
      <StaffAppBar title="Services" subtitle="Bientôt disponible" displayTitle />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Mes services & offres</Text>
          <Text style={styles.sub}>
            La liste de vos prestations, les offres du salon et le partage de lien
            arriveront dans le sprint MS4.
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
