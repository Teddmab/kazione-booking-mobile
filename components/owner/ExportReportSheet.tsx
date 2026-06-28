import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { OwnerSheetHeader } from "@/components/owner/OwnerSheetHeader";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { monthToDateRange } from "@/lib/financePeriod";
import { exportReportCsv } from "@/lib/exportReport";

type Props = {
  visible: boolean;
  businessId: string;
  onClose: () => void;
};

export function ExportReportSheet({ visible, businessId, onClose }: Props) {
  const { t } = useTranslation();
  const defaultRange = monthToDateRange();
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runExport = async () => {
    setLoading(true);
    setError(null);
    try {
      await exportReportCsv({
        businessId,
        type: "appointments",
        from,
        to,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("owner.exportFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <OwnerSheetHeader title={t("owner.exportCsv")} onClose={onClose} disabled={loading} />
          <Text style={styles.label}>{t("owner.exportFrom")}</Text>
          <TextInput
            style={styles.input}
            value={from}
            onChangeText={setFrom}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />
          <Text style={styles.label}>{t("owner.exportTo")}</Text>
          <TextInput
            style={styles.input}
            value={to}
            onChangeText={setTo}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[ownerStyles.primaryBtn, loading && styles.btnDisabled]}
            disabled={loading}
            onPress={() => void runExport()}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={ownerStyles.primaryBtnText}>{t("owner.exportCsvAction")}</Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: ownerColors.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  title: { fontSize: 18, fontWeight: "700", color: ownerColors.text, marginBottom: 16 },
  label: { fontSize: 13, color: ownerColors.textDim, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.card,
  },
  error: { color: ownerColors.danger, fontSize: 13, marginTop: 10 },
  btnDisabled: { opacity: 0.7 },
});
