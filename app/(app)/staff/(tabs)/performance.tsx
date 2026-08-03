import { StyleSheet, Text, View } from "react-native";

import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";

/** Placeholder — implémenté en MS5 */
export default function StaffPerformanceScreen() {
  return (
    <View style={ownerStyles.screen}>
      <StaffAppBar title="Performance" subtitle="Bientôt disponible" displayTitle />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Mes performances</Text>
          <Text style={styles.sub}>
            CA, commissions, avis et parrainages arriveront dans le sprint MS5.
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
