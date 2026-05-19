import { ActivityIndicator, Pressable, Text, View, StyleSheet } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

type Props = {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
};

export function QueryState({
  loading,
  error,
  empty,
  emptyMessage = "Aucune donnée",
  onRetry,
  children,
}: Props) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ownerColors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>Erreur de chargement</Text>
        <Text style={styles.errMsg}>{error.message}</Text>
        {onRetry ? (
          <Pressable style={styles.retry} onPress={onRetry}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{emptyMessage}</Text>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 120,
  },
  errTitle: { fontSize: 17, fontWeight: "600", color: ownerColors.text, marginBottom: 8 },
  errMsg: { fontSize: 14, color: ownerColors.textMuted, textAlign: "center" },
  retry: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: ownerColors.primary,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  empty: { fontSize: 15, color: ownerColors.textMuted, textAlign: "center" },
});
