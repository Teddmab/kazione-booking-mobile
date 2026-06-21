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
import { useCreateProduct } from "@/hooks/useOwnerProducts";
import { useSuppliers } from "@/hooks/useOwnerSuppliers";

interface Props {
  visible: boolean;
  onClose: () => void;
  businessId: string;
}

const CATEGORIES = ["Braiding Hair", "Styling Product", "Treatment", "Tool", "Consumable", "Other"];
const UNITS = ["piece", "ml", "g", "kg", "L", "box", "pack"];
const EMPTY = { name: "", supplier_id: "", category: "", sku: "", unit: "piece", unit_cost: "", current_stock: "", min_stock_alert: "" };

export function AddProductSheet({ visible, onClose, businessId }: Props) {
  const [form, setForm] = useState(EMPTY);
  const createProduct = useCreateProduct(businessId);
  const suppliers = useSuppliers(businessId);
  const supplierList = suppliers.data?.suppliers ?? [];

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function reset() { setForm(EMPTY); }

  function handleSubmit() {
    if (!form.name.trim()) return;
    createProduct.mutate(
      {
        name: form.name.trim(),
        supplier_id: form.supplier_id || null,
        category: form.category || null,
        sku: form.sku || null,
        unit: form.unit || "piece",
        unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
        current_stock: form.current_stock ? Number(form.current_stock) : 0,
        min_stock_alert: form.min_stock_alert ? Number(form.min_stock_alert) : null,
      },
      { onSuccess: () => { reset(); onClose(); } },
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add Product</Text>
          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Kanekalon Braiding Hair" value={form.name} onChangeText={(v) => set("name", v)} />

            <Text style={styles.label}>SKU / Code</Text>
            <TextInput style={styles.input} placeholder="Optional" value={form.sku} onChangeText={(v) => set("sku", v)} />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <Pressable key={c} style={[styles.chip, form.category === c && styles.chipActive]} onPress={() => set("category", c)}>
                  <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {UNITS.map((u) => (
                <Pressable key={u} style={[styles.chip, form.unit === u && styles.chipActive]} onPress={() => set("unit", u)}>
                  <Text style={[styles.chipText, form.unit === u && styles.chipTextActive]}>{u}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Supplier</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              <Pressable style={[styles.chip, !form.supplier_id && styles.chipActive]} onPress={() => set("supplier_id", "")}>
                <Text style={[styles.chipText, !form.supplier_id && styles.chipTextActive]}>None</Text>
              </Pressable>
              {supplierList.map((s) => (
                <Pressable key={s.id} style={[styles.chip, form.supplier_id === s.id && styles.chipActive]} onPress={() => set("supplier_id", s.id)}>
                  <Text style={[styles.chipText, form.supplier_id === s.id && styles.chipTextActive]}>{s.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Unit Cost (€)</Text>
                <TextInput style={styles.input} placeholder="0.00" keyboardType="decimal-pad" value={form.unit_cost} onChangeText={(v) => set("unit_cost", v)} />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Initial Stock</Text>
                <TextInput style={styles.input} placeholder="0" keyboardType="decimal-pad" value={form.current_stock} onChangeText={(v) => set("current_stock", v)} />
              </View>
            </View>

            <Text style={styles.label}>Low Stock Alert</Text>
            <TextInput style={styles.input} placeholder="e.g. 5" keyboardType="decimal-pad" value={form.min_stock_alert} onChangeText={(v) => set("min_stock_alert", v)} />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={() => { reset(); onClose(); }} disabled={createProduct.isPending}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, (!form.name.trim() || createProduct.isPending) && styles.saveBtnDisabled]}
              onPress={handleSubmit}
              disabled={!form.name.trim() || createProduct.isPending}
            >
              {createProduct.isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveText}>Add Product</Text>
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
  sheet: { backgroundColor: ownerColors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, maxHeight: "90%" },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: ownerColors.border, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", color: ownerColors.text, marginBottom: 16 },
  form: { marginBottom: 12 },
  label: { fontSize: 12, color: ownerColors.textDim, marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: ownerColors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: ownerColors.text, backgroundColor: ownerColors.bg },
  chipRow: { marginVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: ownerColors.border, marginRight: 8 },
  chipActive: { borderColor: ownerColors.primary, backgroundColor: ownerColors.primaryMuted },
  chipText: { fontSize: 13, color: ownerColors.textMuted },
  chipTextActive: { color: ownerColors.primary, fontWeight: "600" },
  row: { flexDirection: "row", gap: 10 },
  halfField: { flex: 1 },
  footer: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: ownerColors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  cancelText: { fontSize: 15, fontWeight: "600", color: ownerColors.textMuted },
  saveBtn: { flex: 2, backgroundColor: ownerColors.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
