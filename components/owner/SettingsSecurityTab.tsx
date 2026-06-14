import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

export function SettingsSecurityTab() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [expanded, setExpanded] = useState<"2fa" | "sessions" | "api" | null>(null);

  const toggle2fa = (checked: boolean) => {
    Alert.alert(
      checked ? "Activer la 2FA ?" : "Désactiver la 2FA ?",
      checked
        ? "Vous devrez vérifier votre identité à la prochaine connexion."
        : "Votre compte sera moins protégé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: () => {
            setTwoFactorEnabled(checked);
            Alert.alert(
              checked ? "2FA activée" : "2FA désactivée",
              "Fonctionnalité en préparation — même comportement que le web.",
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sécurité du compte</Text>

      <View style={styles.section}>
        <Pressable style={styles.header} onPress={() => setExpanded(expanded === "2fa" ? null : "2fa")}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Double authentification</Text>
            <Text style={styles.headerDesc}>Couche de sécurité supplémentaire à la connexion</Text>
          </View>
          <View style={[styles.badge, twoFactorEnabled && styles.badgeOn]}>
            <Text style={[styles.badgeText, twoFactorEnabled && styles.badgeTextOn]}>
              {twoFactorEnabled ? "Activée" : "Désactivée"}
            </Text>
          </View>
        </Pressable>
        {expanded === "2fa" ? (
          <View style={styles.body}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Activer la 2FA</Text>
              <Switch
                value={twoFactorEnabled}
                onValueChange={toggle2fa}
                trackColor={{ true: ownerColors.primary }}
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Pressable
          style={styles.header}
          onPress={() => setExpanded(expanded === "sessions" ? null : "sessions")}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Sessions actives</Text>
            <Text style={styles.headerDesc}>Appareils connectés à votre compte</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={ownerColors.textMuted} />
        </Pressable>
        {expanded === "sessions" ? (
          <View style={styles.body}>
            <View style={styles.sessionRow}>
              <View style={styles.dot} />
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>Session actuelle</Text>
                <Text style={styles.sessionMeta}>Cet appareil · Active maintenant</Text>
              </View>
              <Text style={styles.currentBadge}>Actuelle</Text>
            </View>
            <Pressable
              style={styles.outlineDanger}
              onPress={() =>
                Alert.alert("Sessions révoquées", "Les autres sessions ont été déconnectées.")
              }>
              <Text style={styles.outlineDangerText}>Révoquer les autres sessions</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Pressable style={styles.header} onPress={() => setExpanded(expanded === "api" ? null : "api")}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Clés API</Text>
            <Text style={styles.headerDesc}>Accès programmatique à vos données</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={ownerColors.textMuted} />
        </Pressable>
        {expanded === "api" ? (
          <View style={styles.body}>
            <Text style={styles.apiHint}>
              Les clés API donnent un accès complet. Ne les partagez jamais publiquement.
            </Text>
            <View style={styles.apiKeyRow}>
              <Text style={styles.apiKeyValue}>kz_live_••••••••••••••••</Text>
              <Pressable
                onPress={() => Alert.alert("Copié", "Clé exemple copiée (démo, comme sur le web).")}>
                <Text style={styles.copyText}>Copier</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.outlineDanger}
              onPress={() =>
                Alert.alert("Nouvelle clé", "Une nouvelle clé a été générée (démo, comme sur le web).")
              }>
              <Text style={styles.outlineDangerText}>Régénérer la clé</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
    gap: 10,
  },
  title: { fontSize: 15, fontWeight: "700", color: ownerColors.text, marginBottom: 4 },
  section: { borderWidth: 1, borderColor: ownerColors.border, borderRadius: 12, overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
    backgroundColor: ownerColors.bg,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  headerDesc: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  badgeOn: { backgroundColor: "#ecfdf5", borderColor: "#bbf7d0" },
  badgeText: { fontSize: 11, fontWeight: "600", color: ownerColors.textMuted },
  badgeTextOn: { color: "#166534" },
  body: { padding: 12, borderTopWidth: 1, borderTopColor: ownerColors.border, gap: 10 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 14, color: ownerColors.text },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  sessionMeta: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
  currentBadge: { fontSize: 11, fontWeight: "600", color: "#166534" },
  outlineDanger: {
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fef2f2",
  },
  outlineDangerText: { color: "#991b1b", fontWeight: "600", fontSize: 13 },
  apiHint: { fontSize: 12, color: "#1d4ed8", lineHeight: 17 },
  apiKeyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: ownerColors.bg,
  },
  apiKeyValue: { flex: 1, fontFamily: "monospace", fontSize: 12, color: ownerColors.text },
  copyText: { fontSize: 13, fontWeight: "600", color: ownerColors.primary },
});
