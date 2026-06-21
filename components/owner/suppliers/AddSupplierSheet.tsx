import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import {
  useCreateSupplier,
  useDeactivateSupplier,
  useUpdateSupplier,
} from "@/hooks/useOwnerSuppliers";
import type { CreateSupplierData, SupplierRow } from "@/types/suppliers";

interface Props {
  visible: boolean;
  businessId: string;
  supplier?: SupplierRow | null;
  initialName?: string;
  onClose: () => void;
  onSaved?: () => void;
}

const emptyForm: CreateSupplierData = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

export function AddSupplierSheet({
  visible,
  businessId,
  supplier,
  initialName,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!supplier;
  const create = useCreateSupplier(businessId);
  const update = useUpdateSupplier(businessId);
  const deactivate = useDeactivateSupplier(businessId);
  const busy = create.isPending || update.isPending || deactivate.isPending;

  const [form, setForm] = useState<CreateSupplierData>(emptyForm);

  useEffect(() => {
    if (!visible) return;
    if (supplier) {
      setForm({
        name: supplier.name,
        contact_name: supplier.contact_name ?? "",
        email: supplier.email ?? "",
        phone: supplier.phone ?? "",
        address: supplier.address ?? "",
        notes: supplier.notes ?? "",
      });
    } else {
      setForm({ ...emptyForm, name: initialName?.trim() ?? "" });
    }
  }, [visible, supplier, initialName]);

  const setField = (key: keyof CreateSupplierData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const close = () => {
    setForm(emptyForm);
    onClose();
  };

  const submit = () => {
    const name = form.name.trim();
    if (!name) {
      Alert.alert("Champ requis", "Le nom du fournisseur est obligatoire.");
      return;
    }

    const payload: CreateSupplierData = {
      name,
      contact_name: form.contact_name?.trim() || null,
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      address: form.address?.trim() || null,
      notes: form.notes?.trim() || null,
    };

    if (isEdit && supplier) {
      update.mutate(
        { id: supplier.id, data: payload },
        {
          onSuccess: () => {
            onSaved?.();
            close();
          },
          onError: (e) => Alert.alert("Erreur", (e as Error).message),
        },
      );
      return;
    }

    create.mutate(payload, {
      onSuccess: () => {
        onSaved?.();
        close();
      },
      onError: (e) => Alert.alert("Erreur", (e as Error).message),
    });
  };

  const confirmDeactivate = () => {
    if (!supplier) return;
    Alert.alert(
      "Désactiver le fournisseur",
      `Désactiver « ${supplier.name} » ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Désactiver",
          style: "destructive",
          onPress: () =>
            deactivate.mutate(supplier.id, {
              onSuccess: () => {
                onSaved?.();
                close();
              },
              onError: (e) => Alert.alert("Erreur", (e as Error).message),
            }),
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>
              {isEdit ? "Modifier le fournisseur" : "Nouveau fournisseur"}
            </Text>

            <Text style={styles.label}>Nom *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(v) => setField("name", v)} />

            <Text style={styles.label}>Contact</Text>
            <TextInput
              style={styles.input}
              value={form.contact_name ?? ""}
              onChangeText={(v) => setField("contact_name", v)}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={form.email ?? ""}
              onChangeText={(v) => setField("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={form.phone ?? ""}
              onChangeText={(v) => setField("phone", v)}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={form.address ?? ""}
              onChangeText={(v) => setField("address", v)}
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notes]}
              value={form.notes ?? ""}
              onChangeText={(v) => setField("notes", v)}
              multiline
            />

            <Pressable style={[styles.btn, busy && styles.disabled]} disabled={busy} onPress={submit}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>{isEdit ? "Enregistrer" : "Créer"}</Text>
              )}
            </Pressable>

            {isEdit && supplier?.is_active ? (
              <Pressable style={styles.deactivateBtn} disabled={busy} onPress={confirmDeactivate}>
                <Text style={styles.deactivateText}>Désactiver le fournisseur</Text>
              </Pressable>
            ) : null}
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
    padding: 20,
    maxHeight: "90%",
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
  deactivateBtn: { alignItems: "center", marginTop: 12, paddingVertical: 10 },
  deactivateText: { color: ownerColors.danger, fontWeight: "600" },
});
