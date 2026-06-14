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
import { useCreateSupplierOrder, useUpdateOrderStatus } from "@/hooks/useOwnerSuppliers";
import { useOwnerProducts } from "@/hooks/useOwnerProducts";
import { useSuppliers } from "@/hooks/useOwnerSuppliers";
import type { OrderLineItem, SupplierOrderRow } from "@/types/suppliers";

interface Props {
  visible: boolean;
  onClose: () => void;
  businessId: string;
}

const EMPTY_LINE: OrderLineItem = { product_name: "", sku: null, quantity: 1, unit_price: 0, product_id: null };

export function CreateOrderSheet({ visible, onClose, businessId }: Props) {
  const [supplierId, setSupplierId] = useState("");
  const [reference, setReference] = useState("");
  const [items, setItems] = useState<OrderLineItem[]>([{ ...EMPTY_LINE }]);

  const suppliers = useSuppliers(businessId);
  const products = useOwnerProducts(businessId);
  const createOrder = useCreateSupplierOrder(businessId);
  const updateStatus = useUpdateOrderStatus(businessId);

  const supplierList = suppliers.data?.suppliers ?? [];
  const productList = products.data?.products ?? [];

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  function addLine() {
    setItems((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  function removeLine(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof OrderLineItem, value: string | number | null) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function selectProduct(idx: number, productId: string) {
    const prod = productList.find((p) => p.id === productId);
    if (prod) {
      setItems((prev) => prev.map((item, i) => i === idx ? {
        ...item,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        unit_price: prod.unit_cost ?? item.unit_price,
      } : item));
    }
  }

  function reset() {
    setSupplierId("");
    setReference("");
    setItems([{ ...EMPTY_LINE }]);
  }

  const canSubmit = !!supplierId && items.some((i) => i.product_name.trim()) && !createOrder.isPending;

  function submitOrder(andReceive = false) {
    const validItems = items.filter((i) => i.product_name.trim());
    if (!supplierId || validItems.length === 0) return;

    createOrder.mutate(
      { supplier_id: supplierId, reference: reference || undefined, items: validItems },
      {
        onSuccess: (order: SupplierOrderRow) => {
          if (andReceive) {
            updateStatus.mutate({ orderId: order.id, status: "received" });
          }
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
          <Text style={styles.title}>Record Purchase</Text>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Supplier selector */}
            <Text style={styles.label}>Supplier *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {supplierList.map((s) => (
                <Pressable
                  key={s.id}
                  style={[styles.chip, supplierId === s.id && styles.chipActive]}
                  onPress={() => setSupplierId(s.id)}
                >
                  <Text style={[styles.chipText, supplierId === s.id && styles.chipTextActive]}>{s.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Reference */}
            <Text style={styles.label}>Reference</Text>
            <TextInput style={styles.input} placeholder="INV-001 (optional)" value={reference} onChangeText={setReference} />

            {/* Line items */}
            <Text style={styles.label}>Items</Text>
            {items.map((item, idx) => (
              <View key={idx} style={styles.lineCard}>
                {/* Product quick-pick */}
                {productList.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {productList.slice(0, 8).map((p) => (
                      <Pressable
                        key={p.id}
                        style={[styles.chip, item.product_id === p.id && styles.chipActive]}
                        onPress={() => selectProduct(idx, p.id)}
                      >
                        <Text style={[styles.chipText, item.product_id === p.id && styles.chipTextActive]}>{p.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Product name *"
                  value={item.product_name}
                  onChangeText={(v) => updateLine(idx, "product_name", v)}
                />
                <View style={styles.lineRow}>
                  <TextInput
                    style={[styles.input, styles.qtyInput]}
                    placeholder="Qty"
                    keyboardType="decimal-pad"
                    value={String(item.quantity)}
                    onChangeText={(v) => updateLine(idx, "quantity", Number(v) || 0)}
                  />
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    placeholder="€ / unit"
                    keyboardType="decimal-pad"
                    value={item.unit_price ? String(item.unit_price) : ""}
                    onChangeText={(v) => updateLine(idx, "unit_price", Number(v) || 0)}
                  />
                  {items.length > 1 && (
                    <Pressable style={styles.removeBtn} onPress={() => removeLine(idx)}>
                      <Text style={styles.removeBtnText}>×</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
            <Pressable style={styles.addLineBtn} onPress={addLine}>
              <Text style={styles.addLineBtnText}>+ Add Line</Text>
            </Pressable>

            {total > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>€{total.toFixed(2)}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={() => { reset(); onClose(); }} disabled={createOrder.isPending}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <View style={styles.submitGroup}>
              <Pressable style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]} onPress={() => submitOrder(false)} disabled={!canSubmit}>
                {createOrder.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
              </Pressable>
              <Pressable style={[styles.receiveBtn, !canSubmit && styles.saveBtnDisabled]} onPress={() => submitOrder(true)} disabled={!canSubmit}>
                <Text style={styles.saveText}>Save & Received</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { backgroundColor: ownerColors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, maxHeight: "92%" },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: ownerColors.border, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", color: ownerColors.text, marginBottom: 8 },
  form: { marginBottom: 8 },
  label: { fontSize: 12, color: ownerColors.textDim, marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: ownerColors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: ownerColors.text, backgroundColor: ownerColors.bg },
  chipRow: { marginVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: ownerColors.border, marginRight: 8 },
  chipActive: { borderColor: ownerColors.primary, backgroundColor: ownerColors.primaryMuted },
  chipText: { fontSize: 13, color: ownerColors.textMuted },
  chipTextActive: { color: ownerColors.primary, fontWeight: "600" },
  lineCard: { borderWidth: 1, borderColor: ownerColors.border, borderRadius: 10, padding: 10, marginTop: 8, gap: 6 },
  lineRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  qtyInput: { width: 64 },
  priceInput: { flex: 1 },
  removeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: ownerColors.dangerMuted, alignItems: "center", justifyContent: "center" },
  removeBtnText: { fontSize: 18, color: ownerColors.danger, fontWeight: "700", lineHeight: 20 },
  addLineBtn: { marginTop: 8, paddingVertical: 8, alignItems: "center", borderWidth: 1, borderColor: ownerColors.border, borderRadius: 10, borderStyle: "dashed" },
  addLineBtnText: { fontSize: 14, color: ownerColors.primary, fontWeight: "600" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: ownerColors.border },
  totalLabel: { fontSize: 15, fontWeight: "600", color: ownerColors.textMuted },
  totalValue: { fontSize: 15, fontWeight: "700", color: ownerColors.text },
  footer: { marginTop: 8 },
  cancelBtn: { borderWidth: 1, borderColor: ownerColors.border, borderRadius: 10, paddingVertical: 11, alignItems: "center", marginBottom: 8 },
  cancelText: { fontSize: 15, fontWeight: "600", color: ownerColors.textMuted },
  submitGroup: { flexDirection: "row", gap: 8 },
  saveBtn: { flex: 1, backgroundColor: ownerColors.textMuted, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  receiveBtn: { flex: 2, backgroundColor: ownerColors.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
