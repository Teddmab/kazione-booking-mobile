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
import { useCreateProduct } from "@/hooks/useOwnerProducts";
import { useSuppliers } from "@/hooks/useOwnerSuppliers";
import type { CreateProductData } from "@/types/products";

interface Props {
  visible: boolean;
  businessId: string;
  onClose: () => void;
}

const emptyForm: CreateProductData = {
  name: "",
  sku: "",
  category: "",
  unit: "unit",
  unit_cost: null,
  current_stock: 0,
  min_stock_alert: null,
  supplier_id: null,
};

export function AddProductSheet({ visible, businessId, onClose }: Props) {
  const create = useCreateProduct(businessId);
  const suppliers = useSuppliers(businessId, { isActive: true });
  const supplierList = suppliers.data?.suppliers ?? [];

  const [form, setForm] = useState<CreateProductData>(emptyForm);

  useEffect(() => {
    if (visible) setForm(emptyForm);
  }, [visible]);

  const setField = <K extends keyof CreateProductData>(key: K, value: CreateProductData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const close = () => {
    setForm(emptyForm);
    onClose();
  };

  const submit = () => {
    const name = form.name.trim();
    if (!name) {
      Alert.alert("Champ requis", "Le nom du produit est obligatoire.");
      return;
    }

    const payload: CreateProductData = {
      name,
      sku: form.sku?.trim() || null,
      category: form.category?.trim() || null,
      unit: form.unit?.trim() || "unit",
      supplier_id: form.supplier_id || null,
      unit_cost: form.unit_cost != null && !Number.isNaN(Number(form.unit_cost))
        ? Number(form.unit_cost)
        : null,
      current_stock: Number(form.current_stock) || 0,
      min_stock_alert:
        form.min_stock_alert != null && String(form.min_stock_alert).trim() !== ""
          ? Number(form.min_stock_alert)
          : null,
    };

    create.mutate(payload, {
      onSuccess: () => close(),
      onError: (e) => Alert.alert("Erreur", (e as Error).message),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Nouveau produit</Text>

            <Text style={styles.label}>Nom *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(v) => setField("name", v)} />

            <Text style={styles.label}>SKU</Text>
            <TextInput style={styles.input} value={form.sku ?? ""} onChangeText={(v) => setField("sku", v)} />

            <Text style={styles.label}>Catégorie</Text>
            <TextInput
              style={styles.input}
              value={form.category ?? ""}
              onChangeText={(v) => setField("category", v)}
            />

            <Text style={styles.label}>Unité</Text>
            <TextInput
              style={styles.input}
              value={form.unit ?? "unit"}
              onChangeText={(v) => setField("unit", v)}
              placeholder="unit, ml, g…"
            />

            <Text style={styles.label}>Fournisseur</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <Pressable
                style={[styles.chip, !form.supplier_id && styles.chipActive]}
                onPress={() => setField("supplier_id", null)}>
                <Text style={[styles.chipText, !form.supplier_id && styles.chipTextActive]}>Aucun</Text>
              </Pressable>
              {supplierList.map((s) => (
                <Pressable
                  key={s.id}
                  style={[styles.chip, form.supplier_id === s.id && styles.chipActive]}
                  onPress={() => setField("supplier_id", s.id)}>
                  <Text style={[styles.chipText, form.supplier_id === s.id && styles.chipTextActive]}>
                    {s.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Coût unitaire</Text>
            <TextInput
              style={styles.input}
              value={form.unit_cost != null ? String(form.unit_cost) : ""}
              onChangeText={(v) => setField("unit_cost", v === "" ? null : Number(v))}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Stock initial</Text>
            <TextInput
              style={styles.input}
              value={String(form.current_stock ?? 0)}
              onChangeText={(v) => setField("current_stock", Number(v) || 0)}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Seuil d'alerte</Text>
            <TextInput
              style={styles.input}
              value={form.min_stock_alert != null ? String(form.min_stock_alert) : ""}
              onChangeText={(v) =>
                setField("min_stock_alert", v === "" ? null : Number(v))
              }
              keyboardType="number-pad"
            />

            <Pressable
              style={[styles.btn, create.isPending && styles.disabled]}
              disabled={create.isPending}
              onPress={submit}>
              {create.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Créer</Text>
              )}
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
    padding: 20,
    maxHeight: "92%",
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
  chipScroll: { marginVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ownerColors.border,
    marginRight: 8,
  },
  chipActive: { borderColor: ownerColors.primary, backgroundColor: ownerColors.primaryMuted },
  chipText: { fontSize: 13, color: ownerColors.textMuted },
  chipTextActive: { color: ownerColors.primary, fontWeight: "600" },
  btn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  disabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600" },
});
