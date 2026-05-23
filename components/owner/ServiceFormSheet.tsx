import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { CategoryPicker } from "@/components/owner/CategoryPicker";
import { ownerColors } from "@/constants/ownerTheme";
import type { OwnerServiceRow } from "@/types/owner";

const DURATIONS = [15, 30, 45, 60, 75, 90, 120] as const;

export interface ServiceFormValues {
  name: string;
  category_name: string;
  duration_minutes: number;
  price: string;
  description: string;
  is_active: boolean;
}

interface Props {
  visible: boolean;
  service: OwnerServiceRow | null;
  categorySuggestions: string[];
  defaultCurrency?: string;
  onClose: () => void;
  onSubmit: (values: ServiceFormValues, serviceId: string | null) => void;
  onDeactivate?: (serviceId: string) => void;
  busy?: boolean;
}

function emptyForm(currency: string): ServiceFormValues {
  return {
    name: "",
    category_name: "",
    duration_minutes: 60,
    price: "",
    description: "",
    is_active: true,
  };
}

export function ServiceFormSheet({
  visible,
  service,
  categorySuggestions,
  defaultCurrency = "EUR",
  onClose,
  onSubmit,
  onDeactivate,
  busy,
}: Props) {
  const [form, setForm] = useState<ServiceFormValues>(emptyForm(defaultCurrency));

  useEffect(() => {
    if (!visible) return;
    if (service) {
      setForm({
        name: service.name,
        category_name: service.category_name ?? "",
        duration_minutes: service.duration_minutes,
        price: String(service.price),
        description: service.description ?? "",
        is_active: service.is_active,
      });
    } else {
      setForm(emptyForm(defaultCurrency));
    }
  }, [visible, service, defaultCurrency]);

  const validate = (): boolean => {
    if (!form.name.trim()) {
      Alert.alert("Champ requis", "Le nom du service est obligatoire.");
      return false;
    }
    const price = Number(form.price.replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert("Prix invalide", "Indiquez un prix positif.");
      return false;
    }
    return true;
  };

  const save = () => {
    if (!validate()) return;
    onSubmit(form, service?.id ?? null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{service ? "Modifier le service" : "Nouveau service"}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(name) => setForm((f) => ({ ...f, name }))}
              placeholder="Ex. Box braids"
            />

            <CategoryPicker
              value={form.category_name}
              onChange={(category_name) => setForm((f) => ({ ...f, category_name }))}
              suggestions={categorySuggestions}
            />

            <Text style={styles.label}>Durée (minutes)</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.chip, form.duration_minutes === d && styles.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, duration_minutes: d }))}>
                  <Text
                    style={[styles.chipText, form.duration_minutes === d && styles.chipTextActive]}>
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Prix ({defaultCurrency}) *</Text>
            <TextInput
              style={styles.input}
              value={form.price}
              onChangeText={(price) => setForm((f) => ({ ...f, price }))}
              keyboardType="decimal-pad"
              placeholder="95"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.description}
              onChangeText={(description) => setForm((f) => ({ ...f, description }))}
              multiline
              numberOfLines={3}
              placeholder="Optionnel"
            />

            {service ? (
              <View style={styles.switchRow}>
                <Text style={styles.labelInline}>Service actif</Text>
                <Switch
                  value={form.is_active}
                  onValueChange={(is_active) => setForm((f) => ({ ...f, is_active }))}
                  trackColor={{ true: ownerColors.primary }}
                />
              </View>
            ) : null}
          </ScrollView>

          <Pressable
            style={[styles.primaryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={save}>
            <Text style={styles.primaryBtnText}>{busy ? "Enregistrement…" : "Enregistrer"}</Text>
          </Pressable>

          {service && onDeactivate ? (
            <Pressable
              style={styles.dangerBtn}
              disabled={busy}
              onPress={() => {
                Alert.alert(
                  "Désactiver le service",
                  "Ce service ne sera plus réservable. Continuer ?",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Désactiver",
                      style: "destructive",
                      onPress: () => onDeactivate(service.id),
                    },
                  ],
                );
              }}>
              <Text style={styles.dangerText}>Désactiver le service</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Annuler</Text>
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
    padding: 20,
    maxHeight: "90%",
  },
  title: { fontSize: 20, fontWeight: "700", color: ownerColors.text, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: ownerColors.textDim, marginTop: 12, marginBottom: 6 },
  labelInline: { fontSize: 15, color: ownerColors.text, flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: ownerColors.bg,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  chipActive: { backgroundColor: ownerColors.primaryMuted, borderColor: ownerColors.primary },
  chipText: { fontSize: 14, color: ownerColors.textMuted },
  chipTextActive: { color: ownerColors.primary, fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  dangerBtn: { alignItems: "center", paddingVertical: 12, marginTop: 8 },
  dangerText: { color: ownerColors.danger, fontWeight: "600" },
  cancel: { alignItems: "center", paddingVertical: 10 },
  cancelText: { color: ownerColors.textMuted },
});
