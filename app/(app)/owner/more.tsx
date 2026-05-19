import { View, Text, StyleSheet, ScrollView } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

const WEB_ONLY = [
  {
    title: "Finance",
    desc: "Dépenses, transactions et tableau de bord financier.",
  },
  {
    title: "Rapports",
    desc: "Exports et analyses détaillées.",
  },
  {
    title: "Insights IA",
    desc: "Recommandations et tendances.",
  },
  {
    title: "Marketplace",
    desc: "Visibilité et fiche sur le marketplace.",
  },
  {
    title: "Fournisseurs",
    desc: "Achats et gestion des fournisseurs.",
  },
];

export default function OwnerMoreScreen() {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <Text style={styles.intro}>
        Ces sections sont disponibles sur la version web avec les mêmes données et le même
        compte salon.
      </Text>
      {WEB_ONLY.map((item) => (
        <View key={item.title} style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc}>{item.desc}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  intro: {
    fontSize: 15,
    color: ownerColors.textMuted,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: "600", color: ownerColors.text },
  desc: { fontSize: 14, color: ownerColors.textMuted, marginTop: 6, lineHeight: 20 },
});
