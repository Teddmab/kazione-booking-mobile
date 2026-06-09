import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

export interface AddClientValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: AddClientValues) => void;
  busy?: boolean;
}

export function AddClientSheet({ visible, onClose, onSubmit, busy }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setNotes("");
  };

  const submit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Champs requis", "Prénom et nom sont obligatoires.");
      return;
    }
    onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Nouveau client</Text>
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
          <Pressable
            style={[styles.btn, busy && styles.disabled]}
            disabled={busy}
            onPress={submit}>
            <Text style={styles.btnText}>{busy ? "Création…" : "Créer"}</Text>
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
  },
  title: { fontSize: 20, fontWeight: "700", color: ownerColors.text, marginBottom: 12 },
  label: { fontSize: 13, color: ownerColors.textDim, marginTop: 8, marginBottom: 4 },
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
  btn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600" },
});
