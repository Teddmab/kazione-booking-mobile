import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { OwnerSheetHeader } from "@/components/owner/OwnerSheetHeader";
import { ownerColors } from "@/constants/ownerTheme";
import { useToast } from "@/contexts/ToastContext";

export type StaffInviteRole = "manager" | "staff" | "receptionist";

export interface InviteStaffValues {
  first_name: string;
  last_name: string;
  email: string;
  role: StaffInviteRole;
  phone: string;
  position: string;
}

const ROLES: { value: StaffInviteRole; label: string }[] = [
  { value: "manager", label: "Gérant" },
  { value: "staff", label: "Coiffeur·se" },
  { value: "receptionist", label: "Réception" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: InviteStaffValues) => void;
  busy?: boolean;
}

const empty: InviteStaffValues = {
  first_name: "",
  last_name: "",
  email: "",
  role: "staff",
  phone: "",
  position: "",
};

export function InviteStaffSheet({ visible, onClose, onSubmit, busy }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<InviteStaffValues>(empty);

  const reset = () => setForm(empty);

  const validate = (): boolean => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.warning("Champs requis", "Prénom et nom sont obligatoires.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.warning("Email invalide", "Vérifiez l'adresse email.");
      return false;
    }
    return true;
  };

  const submit = () => {
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          reset();
          onClose();
        }}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <OwnerSheetHeader
            title="Inviter un membre"
            onClose={() => {
              reset();
              onClose();
            }}
            disabled={busy}
          />
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              style={styles.input}
              value={form.first_name}
              onChangeText={(first_name) => setForm((f) => ({ ...f, first_name }))}
              autoCapitalize="words"
            />
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={form.last_name}
              onChangeText={(last_name) => setForm((f) => ({ ...f, last_name }))}
              autoCapitalize="words"
            />
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(email) => setForm((f) => ({ ...f, email }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(phone) => setForm((f) => ({ ...f, phone }))}
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Position</Text>
            <TextInput
              style={styles.input}
              value={form.position}
              onChangeText={(position) => setForm((f) => ({ ...f, position }))}
              placeholder="ex. Senior Stylist, Barber"
            />
            <Text style={styles.label}>Rôle</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.value}
                  style={[styles.chip, form.role === r.value && styles.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, role: r.value }))}>
                  <Text style={[styles.chipText, form.role === r.value && styles.chipTextActive]}>
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Pressable
            style={[styles.primaryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={submit}>
            <Text style={styles.primaryBtnText}>{busy ? "Envoi…" : "Envoyer l'invitation"}</Text>
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
    maxHeight: "88%",
  },
  title: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  label: { fontSize: 13, fontWeight: "600", color: ownerColors.textDim, marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: ownerColors.bg,
  },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  chipActive: { backgroundColor: ownerColors.primaryMuted, borderColor: ownerColors.primary },
  chipText: { fontSize: 13, color: ownerColors.textMuted },
  chipTextActive: { color: ownerColors.primary, fontWeight: "600" },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
});
