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

import { ownerColors } from "@/constants/ownerTheme";
import type { StaffMember } from "@/types/owner";

type EditableRole = "manager" | "staff" | "receptionist";

const ROLES: { value: EditableRole; label: string }[] = [
  { value: "manager", label: "Gérant" },
  { value: "staff", label: "Coiffeur·se" },
  { value: "receptionist", label: "Réception" },
];

export interface StaffUpdateValues {
  display_name: string;
  role: EditableRole;
  is_active: boolean;
}

interface Props {
  member: StaffMember | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, values: StaffUpdateValues) => void;
  busy?: boolean;
}

export function StaffDetailSheet({ member, visible, onClose, onSave, busy }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<EditableRole>("staff");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!member || !visible) return;
    setDisplayName(member.display_name);
    const r = member.role as EditableRole;
    setRole(
      r === "manager" || r === "receptionist" ? r : "staff",
    );
    setIsActive(member.is_active);
  }, [member, visible]);

  if (!member) return null;

  const save = () => {
    if (!displayName.trim()) {
      Alert.alert("Nom requis", "Le nom affiché ne peut pas être vide.");
      return;
    }
    onSave(member.id, { display_name: displayName.trim(), role, is_active: isActive });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Membre de l&apos;équipe</Text>
          <ScrollView>
            {member.email ? <Text style={styles.email}>{member.email}</Text> : null}

            <Text style={styles.label}>Nom affiché</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

            <Text style={styles.label}>Rôle</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.value}
                  style={[styles.chip, role === r.value && styles.chipActive]}
                  onPress={() => setRole(r.value)}>
                  <Text style={[styles.chipText, role === r.value && styles.chipTextActive]}>
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Compte actif</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ true: ownerColors.primary }}
              />
            </View>
          </ScrollView>

          <Pressable
            style={[styles.primaryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={save}>
            <Text style={styles.primaryBtnText}>{busy ? "Enregistrement…" : "Enregistrer"}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Fermer</Text>
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
    maxHeight: "80%",
  },
  title: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  email: { fontSize: 14, color: ownerColors.textMuted, marginTop: 4, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: ownerColors.textDim, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: ownerColors.bg,
  },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  switchLabel: { fontSize: 15, color: ownerColors.text },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  cancel: { alignItems: "center", paddingVertical: 10 },
  cancelText: { color: ownerColors.textMuted },
});
