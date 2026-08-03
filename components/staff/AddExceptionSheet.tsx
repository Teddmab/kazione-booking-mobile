import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import type { StaffOverride } from "@/services/staff/profile";

type ExceptionType = "day_off" | "custom";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (override: Omit<StaffOverride, "id">) => void;
  busy?: boolean;
  defaultDate?: string;
}

export function AddExceptionSheet({
  visible,
  onClose,
  onSave,
  busy,
  defaultDate,
}: Props) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<ExceptionType>("day_off");
  const [date, setDate] = useState(defaultDate ?? "");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("14:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setType("day_off");
      setDate(defaultDate ?? "");
      setStartTime("10:00");
      setEndTime("14:00");
      setReason("");
      setError(null);
    }
  }, [visible, defaultDate]);

  function handleSave() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Date invalide (format YYYY-MM-DD)");
      return;
    }
    if (type === "custom") {
      if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
        setError("Horaires invalides (format HH:MM)");
        return;
      }
    }
    onSave({
      override_date: date,
      is_available: type === "custom",
      start_time: type === "custom" ? startTime : null,
      end_time: type === "custom" ? endTime : null,
      reason: reason.trim() || null,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Nouvelle exception</Text>

        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeChip, type === "day_off" && styles.typeChipActive]}
            onPress={() => setType("day_off")}>
            <Text
              style={[
                styles.typeText,
                type === "day_off" && styles.typeTextActive,
              ]}>
              Jour off
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeChip, type === "custom" && styles.typeChipActive]}
            onPress={() => setType("custom")}>
            <Text
              style={[
                styles.typeText,
                type === "custom" && styles.typeTextActive,
              ]}>
              Horaires custom
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="2026-08-15"
          placeholderTextColor={ownerColors.textDim}
          autoCapitalize="none"
        />

        {type === "custom" ? (
          <View style={styles.times}>
            <View style={styles.timeCol}>
              <Text style={styles.label}>Début</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="10:00"
                placeholderTextColor={ownerColors.textDim}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.timeCol}>
              <Text style={styles.label}>Fin</Text>
              <TextInput
                style={styles.input}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="14:00"
                placeholderTextColor={ownerColors.textDim}
                autoCapitalize="none"
              />
            </View>
          </View>
        ) : null}

        <Text style={styles.label}>Raison (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.reason]}
          value={reason}
          onChangeText={setReason}
          placeholder="Congé, formation…"
          placeholderTextColor={ownerColors.textDim}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.saveBtn, busy && styles.disabled]}
          disabled={busy}
          onPress={handleSave}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Enregistrer</Text>
          )}
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onClose} disabled={busy}>
          <Text style={styles.cancelText}>Annuler</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,15,10,0.4)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: ownerColors.border,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: ownerColors.border,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: ownerColors.text,
    marginBottom: 14,
    fontFamily: ownerFonts.bold,
  },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: ownerColors.bg,
  },
  typeChipActive: {
    borderColor: ownerColors.primary,
    backgroundColor: ownerColors.primarySurface,
  },
  typeText: {
    fontSize: 13,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  typeTextActive: {
    color: ownerColors.primary,
    fontWeight: "600",
  },
  label: {
    fontSize: 12,
    color: ownerColors.textMuted,
    marginBottom: 6,
    marginTop: 4,
    fontFamily: ownerFonts.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.bg,
    marginBottom: 8,
    fontFamily: ownerFonts.regular,
  },
  reason: { minHeight: 44 },
  times: { flexDirection: "row", gap: 10 },
  timeCol: { flex: 1 },
  error: {
    color: ownerColors.danger,
    fontSize: 13,
    marginBottom: 8,
    fontFamily: ownerFonts.regular,
  },
  saveBtn: {
    backgroundColor: ownerColors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  disabled: { opacity: 0.7 },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  cancelBtn: { alignItems: "center", paddingVertical: 14 },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.semiBold,
  },
});
