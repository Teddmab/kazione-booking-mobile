import { useState } from "react";
import {
  ActivityIndicator,
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
import { useAdjustStock, useOwnerProducts } from "@/hooks/useOwnerProducts";
import type { ProductRow } from "@/types/products";

interface ProductUsed {
  product: ProductRow;
  quantity: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  businessId: string;
  appointmentId: string;
  /** Called after stock deductions are recorded — caller should then mark appointment complete */
  onConfirm: () => void;
}

export function ProductsUsedSheet({
  visible,
  onClose,
  businessId,
  appointmentId,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<ProductUsed[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const productsQuery = useOwnerProducts(businessId);
  const adjustStock = useAdjustStock(businessId);

  const productList = (productsQuery.data?.products ?? []).filter((p) => p.is_active);

  function isSelected(id: string) {
    return selected.some((s) => s.product.id === id);
  }

  function toggleProduct(product: ProductRow) {
    if (isSelected(product.id)) {
      setSelected((prev) => prev.filter((s) => s.product.id !== product.id));
    } else {
      setSelected((prev) => [...prev, { product, quantity: 1 }]);
    }
  }

  function updateQty(productId: string, qty: number) {
    setSelected((prev) =>
      prev.map((s) => s.product.id === productId ? { ...s, quantity: Math.max(0.1, qty) } : s),
    );
  }

  function reset() {
    setSelected([]);
    setSubmitting(false);
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      // Record manual stock deductions for each selected product
      for (const item of selected) {
        await adjustStock.mutateAsync({
          productId: item.product.id,
          data: {
            movement_type: "service_use",
            quantity: item.quantity,
            notes: `Appointment ${appointmentId} — manual selection`,
          },
        });
      }
      reset();
      onConfirm();
    } catch (e) {
      Alert.alert("Error", "Could not record stock usage. Please try again.");
      setSubmitting(false);
    }
  }

  function skipAndComplete() {
    reset();
    onConfirm();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Products Used</Text>
          <Text style={styles.subtitle}>
            Select any products consumed during this service. Stock will be deducted automatically.
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {productsQuery.isLoading && <ActivityIndicator style={{ marginTop: 16 }} color={ownerColors.primary} />}

            {productList.length === 0 && !productsQuery.isLoading && (
              <Text style={styles.empty}>No products in catalog. Add products in the Suppliers section.</Text>
            )}

            {productList.map((product) => {
              const sel = selected.find((s) => s.product.id === product.id);
              const active = !!sel;
              return (
                <View key={product.id} style={[styles.row, active && styles.rowActive]}>
                  <Pressable style={styles.rowMain} onPress={() => toggleProduct(product)}>
                    <View style={[styles.checkbox, active && styles.checkboxActive]}>
                      {active && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      {product.category && (
                        <Text style={styles.productMeta}>{product.category} · Stock: {product.current_stock} {product.unit}</Text>
                      )}
                    </View>
                  </Pressable>
                  {active && (
                    <View style={styles.qtyBox}>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => updateQty(product.id, (sel?.quantity ?? 1) - 1)}
                      >
                        <Text style={styles.qtyBtnText}>−</Text>
                      </Pressable>
                      <TextInput
                        style={styles.qtyInput}
                        keyboardType="decimal-pad"
                        value={String(sel?.quantity ?? 1)}
                        onChangeText={(v) => updateQty(product.id, parseFloat(v) || 0)}
                      />
                      <Text style={styles.qtyUnit}>{product.unit}</Text>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => updateQty(product.id, (sel?.quantity ?? 1) + 1)}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.skipBtn} onPress={skipAndComplete} disabled={submitting}>
              <Text style={styles.skipText}>Skip — Complete Anyway</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, (submitting || selected.length === 0) && styles.confirmBtnDisabled]}
              onPress={() => void handleConfirm()}
              disabled={submitting || selected.length === 0}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.confirmText}>
                    Complete · Deduct {selected.length} product{selected.length !== 1 ? "s" : ""}
                  </Text>
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
  title: { fontSize: 18, fontWeight: "700", color: ownerColors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: ownerColors.textMuted, marginBottom: 12, lineHeight: 18 },
  list: { flex: 1, marginBottom: 8 },
  empty: { textAlign: "center", color: ownerColors.textMuted, marginTop: 24, fontSize: 14 },
  row: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  rowActive: { borderColor: ownerColors.primary, backgroundColor: ownerColors.primaryMuted },
  rowMain: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { borderColor: ownerColors.primary, backgroundColor: ownerColors.primary },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  rowInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  productMeta: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
  qtyBox: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 18, color: ownerColors.text, lineHeight: 20 },
  qtyInput: {
    minWidth: 48,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 15,
    color: ownerColors.text,
    textAlign: "center",
  },
  qtyUnit: { fontSize: 13, color: ownerColors.textMuted },
  footer: { gap: 8, marginTop: 8 },
  skipBtn: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  skipText: { fontSize: 14, fontWeight: "600", color: ownerColors.textMuted },
  confirmBtn: {
    backgroundColor: ownerColors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
