import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import { parseClientCsv } from "@/lib/parseClientCsv";
import { clientDisplayName } from "@/lib/format";
import type { ImportClientRow } from "@/types/owner";

interface Props {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (rows: ImportClientRow[]) => void;
}

export function ImportClientsSheet({ visible, busy, onClose, onConfirm }: Props) {
  const [rows, setRows] = useState<ImportClientRow[]>([]);
  const [picking, setPicking] = useState(false);

  const reset = () => setRows([]);

  const pickFile = async () => {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "text/plain"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;

      const uri = result.assets[0].uri;
      const text = await FileSystem.readAsStringAsync(uri);
      const parsed = parseClientCsv(text);
      if (parsed.length === 0) {
        Alert.alert("Fichier vide", "Aucun client valide trouvé dans ce CSV.");
        return;
      }
      setRows(parsed);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Impossible de lire le fichier.");
    } finally {
      setPicking(false);
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  const preview = rows.slice(0, 5);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Importer des clients</Text>
          <Text style={styles.hint}>
            CSV avec colonnes : first_name, last_name, email, phone
          </Text>

          {rows.length === 0 ? (
            <Pressable
              style={[styles.pickBtn, picking && styles.disabled]}
              disabled={picking || busy}
              onPress={() => void pickFile()}>
              {picking ? (
                <ActivityIndicator color={ownerColors.primary} />
              ) : (
                <Text style={styles.pickText}>Choisir un fichier CSV</Text>
              )}
            </Pressable>
          ) : (
            <>
              <Text style={styles.previewTitle}>Importer {rows.length} client(s)</Text>
              <FlatList
                data={preview}
                keyExtractor={(_, i) => String(i)}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewName}>
                      {clientDisplayName(item.first_name, item.last_name ?? "")}
                    </Text>
                    <Text style={styles.previewMeta}>
                      {[item.email, item.phone].filter(Boolean).join(" · ") || "—"}
                    </Text>
                  </View>
                )}
              />
              {rows.length > 5 ? (
                <Text style={styles.more}>… et {rows.length - 5} autre(s)</Text>
              ) : null}
              <Pressable
                style={[styles.primaryBtn, busy && styles.disabled]}
                disabled={busy}
                onPress={() => onConfirm(rows)}>
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Confirmer l&apos;import</Text>
                )}
              </Pressable>
              <Pressable onPress={reset} disabled={busy}>
                <Text style={styles.link}>Choisir un autre fichier</Text>
              </Pressable>
            </>
          )}

          <Pressable onPress={close} style={styles.cancelWrap}>
            <Text style={styles.cancel}>Annuler</Text>
          </Pressable>
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
    padding: 24,
    maxHeight: "85%",
  },
  title: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  hint: { fontSize: 13, color: ownerColors.textMuted, marginTop: 6, marginBottom: 16 },
  pickBtn: {
    borderWidth: 1,
    borderColor: ownerColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderStyle: "dashed",
  },
  pickText: { color: ownerColors.primary, fontWeight: "600" },
  previewTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10, color: ownerColors.text },
  previewRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ownerColors.border,
  },
  previewName: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  previewMeta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
  more: { fontSize: 13, color: ownerColors.textMuted, marginTop: 8, marginBottom: 12 },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  primaryText: { color: "#fff", fontWeight: "600" },
  link: { textAlign: "center", color: ownerColors.primary, marginTop: 12, fontWeight: "600" },
  cancelWrap: { alignItems: "center", marginTop: 16 },
  cancel: { color: ownerColors.textMuted, fontSize: 15 },
  disabled: { opacity: 0.6 },
});
