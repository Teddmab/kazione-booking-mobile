import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import { useCreateSupplier } from "@/hooks/useOwnerSuppliers";

interface Props {
  visible: boolean;
  onClose: () => void;
  businessId: string;
}

const EMPTY = { name: "", contact_name: "", email: "", phone: "", address: "", notes: "" };

export function AddSupplierSheet({ visible, onClose, businessId }: Props) {
  const [form, setForm] = useState(EMPTY);
  const createSupplier = useCreateSupplier(businessId);

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function reset() {
    setForm(EMPTY);
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    createSupplier.mutate(
      {
        name: form.name.trim(),
        contact_name: form.contact_name || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add Supplier</Text>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Afro Supplies EU"
              value={form.name}
              onChangeText={(v) => set("name", v)}
            />

            <Text style={styles.label}>Contact Person</Text>
            <TextInput style={styles.input} placeholder="e.g. Maria Kivi" value={form.contact_name} onChangeText={(v) => set("contact_name", v)} />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="supplier@email.com" keyboardType="email-address" value={form.email} onChangeText={(v) => set("email", v)} />

            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} placeholder="+372..." keyboardType="phone-pad" value={form.phone} onChangeText={(v) => set("phone", v)} />

            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} placeholder="Street, City" value={form.address} onChangeText={(v) => set("address", v)} />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Optional notes..."
              multiline
              numberOfLines={3}
              value={form.notes}
              onChangeText={(v) => set("notes", v)}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={() => { reset(); onClose(); }} disabled={createSupplier.isPending}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, (!form.name.trim() || createSupplier.isPending) && styles.saveBtnDisabled]}
              onPress={handleSubmit}
              disabled={!form.name.trim() || createSupplier.isPending}
            >
              {createSupplier.isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveText}>Save Supplier</Text>
              }
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: ownerColors.border, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", color: ownerColors.text, marginBottom: 16 },
  form: { marginBottom: 12 },
  label: { fontSize: 12, color: ownerColors.textDim, marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: ownerColors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: ownerColors.text, backgroundColor: ownerColors.bg,
  },
  multiline: { height: 72, textAlignVertical: "top" },
  footer: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: ownerColors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  cancelText: { fontSize: 15, fontWeight: "600", color: ownerColors.textMuted },
  saveBtn: { flex: 2, backgroundColor: ownerColors.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
