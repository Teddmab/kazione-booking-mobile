import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import type { ServiceInsight } from "@/services/owner/ai";

interface Props {
  visible: boolean;
  loading: boolean;
  error: boolean;
  summary?: string;
  insights: ServiceInsight[];
  dismissedNames: Set<string>;
  onClose: () => void;
  onRefresh: () => void;
  onFix: (insight: ServiceInsight) => void;
  onDismiss: (serviceName: string) => void;
}

function severityLabel(severity: ServiceInsight["severity"]): string {
  if (severity === "ok") return "OK";
  if (severity === "warning") return "Avertissement";
  return "Action requise";
}

function severityStyle(severity: ServiceInsight["severity"]) {
  if (severity === "ok") return styles.badgeOk;
  if (severity === "warning") return styles.badgeWarning;
  return styles.badgeError;
}

function severityTextStyle(severity: ServiceInsight["severity"]) {
  if (severity === "ok") return styles.badgeOkText;
  if (severity === "warning") return styles.badgeWarningText;
  return styles.badgeErrorText;
}

export function ServiceAiPanel({
  visible,
  loading,
  error,
  summary,
  insights,
  dismissedNames,
  onClose,
  onRefresh,
  onFix,
  onDismiss,
}: Props) {
  const visibleInsights = insights.filter(
    (item) => !dismissedNames.has(item.service_name.toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Ionicons name="sparkles" size={18} color={ownerColors.primary} />
            <Text style={styles.headerTitle}>Analyse IA des services</Text>
            <Pressable onPress={onRefresh} style={styles.headerBtn} accessibilityLabel="Actualiser">
              <Ionicons name="refresh-outline" size={18} color={ownerColors.textMuted} />
            </Pressable>
            <Pressable onPress={onClose} style={styles.headerBtn} accessibilityLabel="Fermer">
              <Ionicons name="close" size={20} color={ownerColors.textMuted} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={ownerColors.primary} />
              <Text style={styles.loadingText}>Analyse en cours…</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>
              Analyse impossible. Vérifiez la configuration IA et réessayez.
            </Text>
          ) : (
            <>
              {summary ? <Text style={styles.summary}>{summary}</Text> : null}
              <FlatList
                data={visibleInsights}
                keyExtractor={(item) => item.service_name}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                  <View style={styles.allOk}>
                    <Ionicons name="checkmark-circle" size={20} color="#166534" />
                    <Text style={styles.allOkText}>Tous les services semblent corrects.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.item}>
                    <View style={styles.itemTop}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.service_name}
                      </Text>
                      <View style={[styles.badge, severityStyle(item.severity)]}>
                        <Text style={[styles.badgeText, severityTextStyle(item.severity)]}>
                          {severityLabel(item.severity)}
                        </Text>
                      </View>
                    </View>
                    {item.issues.map((issue) => (
                      <Text key={issue} style={styles.issue}>
                        • {issue}
                      </Text>
                    ))}
                    {item.severity !== "ok" ? (
                      <View style={styles.itemActions}>
                        <Pressable style={styles.fixBtn} onPress={() => onFix(item)}>
                          <Text style={styles.fixBtnText}>Corriger</Text>
                        </Pressable>
                        <Pressable onPress={() => onDismiss(item.service_name.toLowerCase())}>
                          <Text style={styles.dismissText}>Ignorer</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                )}
              />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
    minHeight: "45%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ownerColors.border,
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: ownerColors.text },
  headerBtn: { padding: 4 },
  center: { alignItems: "center", paddingVertical: 32, gap: 12 },
  loadingText: { fontSize: 14, color: ownerColors.textMuted },
  errorText: {
    fontSize: 14,
    color: ownerColors.danger,
    padding: 16,
    lineHeight: 20,
  },
  summary: {
    fontSize: 13,
    color: ownerColors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 12,
    lineHeight: 18,
  },
  list: { padding: 16, gap: 10 },
  allOk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  allOkText: { flex: 1, fontSize: 13, color: "#166534" },
  item: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: ownerColors.bg,
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  itemName: { flex: 1, fontSize: 14, fontWeight: "600", color: ownerColors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeOk: { backgroundColor: "#ecfdf5" },
  badgeWarning: { backgroundColor: "#fffbeb" },
  badgeError: { backgroundColor: "#fef2f2" },
  badgeText: { fontSize: 10, fontWeight: "700" },
  badgeOkText: { color: "#166534" },
  badgeWarningText: { color: "#92400e" },
  badgeErrorText: { color: "#991b1b" },
  issue: { fontSize: 12, color: ownerColors.textMuted, lineHeight: 18 },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 10,
  },
  fixBtn: {
    backgroundColor: ownerColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fixBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  dismissText: { fontSize: 12, fontWeight: "600", color: ownerColors.textMuted },
});
