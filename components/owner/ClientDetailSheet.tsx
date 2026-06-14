import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import type { ClientWithStats } from "@/types/owner";

export interface ClientEditValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes: string;
}

interface Props {
  client: ClientWithStats | null;
  visible: boolean;
  onClose: () => void;
  onSave?: (id: string, values: ClientEditValues) => void;
  busy?: boolean;
}

export function ClientDetailSheet({ client, visible, onClose, onSave, busy }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!client || !visible) return;
    setFirstName(client.first_name);
    setLastName(client.last_name);
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setNotes((client as { notes?: string }).notes ?? "");
  }, [client, visible]);

  if (!client) return null;

  const name = clientDisplayName(client.first_name, client.last_name);
  const editing = !!onSave;

  const save = () => {
    if (!onSave) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Champs requis", "Prénom et nom sont obligatoires.");
      return;
    }
    onSave(client.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView>
            <Text style={styles.title}>{editing ? "Client" : name}</Text>

            {editing ? (
              <>
                <Text style={styles.label}>Prénom</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
                <Text style={styles.label}>Nom</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.label}>Téléphone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.notes]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </>
            ) : (
              <>
                {client.email ? <Text style={styles.line}>✉️ {client.email}</Text> : null}
                {client.phone ? <Text style={styles.line}>📞 {client.phone}</Text> : null}
              </>
            )}

            <View style={styles.statsBox}>
              <Text style={styles.stat}>Rendez-vous : {client.appointment_count} au total</Text>
              <Text style={styles.stat}>Dépenses : {formatCurrency(client.total_spent)}</Text>
              {client.last_visit ? (
                <Text style={styles.stat}>Dernière visite : {formatDate(client.last_visit)}</Text>
              ) : (
                <Text style={styles.statMuted}>Pas encore de visite enregistrée</Text>
              )}
            </View>

            {onSave ? (
              <Pressable
                style={[styles.saveBtn, busy && styles.disabled]}
                disabled={busy}
                onPress={save}>
                <Text style={styles.saveBtnText}>{busy ? "Enregistrement…" : "Enregistrer"}</Text>
              </Pressable>
            ) : null}

            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Fermer</Text>
            </Pressable>
          </ScrollView>
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
    maxHeight: "90%",
  },
  title: { fontSize: 22, fontWeight: "700", color: ownerColors.text, marginBottom: 12 },
  label: { fontSize: 13, color: ownerColors.textDim, marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.bg,
  },
  notes: { minHeight: 72, textAlignVertical: "top" },
  line: { fontSize: 15, color: ownerColors.text, lineHeight: 24 },
  statsBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: ownerColors.bg,
    borderWidth: 1,
    borderColor: ownerColors.border,
    gap: 8,
  },
  stat: { fontSize: 15, color: ownerColors.text },
  statMuted: { fontSize: 14, color: ownerColors.textMuted },
  saveBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "600" },
  close: { alignItems: "center", marginTop: 16, paddingVertical: 10 },
  closeText: { fontSize: 15, color: ownerColors.primary, fontWeight: "600" },
});
