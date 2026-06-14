import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
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

import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import { useProducts } from "@/hooks/useOwnerProducts";
import {
  useCreateSupplierOrder,
  useScanInvoice,
  useSuppliers,
  useUpdateOrderStatus,
} from "@/hooks/useOwnerSuppliers";
import { formatCurrency } from "@/lib/format";
import type { CreateOrderItemData } from "@/types/suppliers";

interface Props {
  visible: boolean;
  businessId: string;
  onClose: () => void;
  onNeedNewSupplier?: (hint: string) => void;
}

const emptyLine = (): CreateOrderItemData => ({
  product_name: "",
  sku: "",
  quantity: 1,
  unit_price: 0,
});

export function CreateOrderSheet({ visible, businessId, onClose, onNeedNewSupplier }: Props) {
  const suppliers = useSuppliers(businessId, { isActive: true });
  const products = useProducts(businessId);
  const createOrder = useCreateSupplierOrder(businessId);
  const updateStatus = useUpdateOrderStatus(businessId);
  const scan = useScanInvoice(businessId);

  const supplierList = suppliers.data?.suppliers ?? [];
  const productList = products.data?.products ?? [];

  const [supplierId, setSupplierId] = useState("");
  const [reference, setReference] = useState("");
  const [items, setItems] = useState<CreateOrderItemData[]>([emptyLine()]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (visible) {
      setSupplierId("");
      setReference("");
      setItems([emptyLine()]);
    }
  }, [visible]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [items],
  );

  const busy = createOrder.isPending || updateStatus.isPending || scanning || scan.isPending;

  const close = () => {
    setSupplierId("");
    setReference("");
    setItems([emptyLine()]);
    onClose();
  };

  const addItem = () => setItems((prev) => [...prev, emptyLine()]);

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateItem = (index: number, patch: Partial<CreateOrderItemData>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const applyProductToLine = (index: number, productId: string) => {
    const product = productList.find((p) => p.id === productId);
    if (!product) return;
    updateItem(index, {
      product_name: product.name,
      sku: product.sku ?? "",
      unit_price: product.unit_cost ?? 0,
    });
  };

  const canSubmit =
    !!supplierId && items.some((i) => i.product_name.trim()) && !busy;

  const buildPayload = () => ({
    supplier_id: supplierId,
    reference: reference.trim() || undefined,
    items: items
      .filter((i) => i.product_name.trim())
      .map((i) => ({
        product_name: i.product_name.trim(),
        sku: i.sku?.trim() || null,
        quantity: Number(i.quantity) || 0,
        unit_price: Number(i.unit_price) || 0,
      })),
  });

  const submit = (markReceived: boolean) => {
    if (!canSubmit) return;
    const payload = buildPayload();
    if (payload.items.length === 0) {
      Alert.alert("Lignes requises", "Ajoutez au moins une ligne de produit.");
      return;
    }

    createOrder.mutate(payload, {
      onSuccess: (order) => {
        if (markReceived) {
          updateStatus.mutate(
            { orderId: order.id, status: "received" },
            { onSuccess: () => close(), onError: (e) => Alert.alert("Erreur", (e as Error).message) },
          );
        } else {
          close();
        }
      },
      onError: (e) => Alert.alert("Erreur", (e as Error).message),
    });
  };

  const pickImageAndScan = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission requise", "Autorisez l'accès à la caméra ou à la galerie.");
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });

    if (result.canceled || !result.assets[0]) return;

    setScanning(true);
    try {
      const uri = result.assets[0].uri;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
      const mediaType = result.assets[0].mimeType ?? "image/jpeg";

      const parsed = await scan.mutateAsync({ imageBase64: base64, mediaType });

      if (parsed.items.length > 0) {
        setItems(
          parsed.items.map((item) => ({
            product_name: item.product_name,
            sku: item.sku ?? "",
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        );
      }

      if (parsed.matched_supplier) {
        setSupplierId(parsed.matched_supplier.id);
      } else if (parsed.supplier_hint) {
        const hint = parsed.supplier_hint.toLowerCase();
        const matched = supplierList.find((s) => s.name.toLowerCase().includes(hint));
        if (matched) {
          setSupplierId(matched.id);
        } else {
          onNeedNewSupplier?.(parsed.supplier_hint);
        }
      }
    } catch (e) {
      Alert.alert(
        "Analyse impossible",
        e instanceof Error ? e.message : "Vérifiez que l'image de la facture est lisible.",
      );
    } finally {
      setScanning(false);
    }
  };

  const handleScanPress = () => {
    Alert.alert("Scanner une facture", "Choisir la source de l'image", [
      { text: "Caméra", onPress: () => void pickImageAndScan(true) },
      { text: "Galerie", onPress: () => void pickImageAndScan(false) },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Nouvel achat</Text>

            <Pressable
              style={[styles.scanBtn, scanning && styles.disabled]}
              disabled={scanning}
              onPress={handleScanPress}>
              {scanning ? (
                <View style={styles.scanRow}>
                  <ActivityIndicator color={ownerColors.primary} />
                  <Text style={styles.scanText}>Analyse en cours…</Text>
                </View>
              ) : (
                <Text style={styles.scanText}>📷 Scanner une facture</Text>
              )}
            </Pressable>

            <Text style={styles.label}>Fournisseur *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {supplierList.map((s) => (
                <Pressable
                  key={s.id}
                  style={[styles.chip, supplierId === s.id && styles.chipActive]}
                  onPress={() => setSupplierId(s.id)}>
                  <Text style={[styles.chipText, supplierId === s.id && styles.chipTextActive]}>
                    {s.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Référence</Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder="Optionnel"
            />

            <View style={styles.linesHeader}>
              <Text style={styles.label}>Lignes</Text>
              <Pressable onPress={addItem}>
                <Text style={styles.addLine}>+ Ligne</Text>
              </Pressable>
            </View>

            {items.map((item, index) => (
              <View key={index} style={styles.lineCard}>
                <View style={styles.lineTop}>
                  <Text style={styles.lineNum}>Ligne {index + 1}</Text>
                  {items.length > 1 ? (
                    <Pressable onPress={() => removeItem(index)}>
                      <Text style={styles.removeLine}>Supprimer</Text>
                    </Pressable>
                  ) : null}
                </View>

                {productList.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {productList.slice(0, 12).map((p) => (
                      <Pressable
                        key={p.id}
                        style={styles.productChip}
                        onPress={() => applyProductToLine(index, p.id)}>
                        <Text style={styles.productChipText} numberOfLines={1}>
                          {p.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}

                <TextInput
                  style={styles.input}
                  value={item.product_name}
                  onChangeText={(v) => updateItem(index, { product_name: v })}
                  placeholder="Nom du produit"
                />
                <View style={styles.row2}>
                  <TextInput
                    style={[styles.input, styles.flex1]}
                    value={item.sku ?? ""}
                    onChangeText={(v) => updateItem(index, { sku: v })}
                    placeholder="SKU"
                  />
                  <TextInput
                    style={[styles.input, styles.qtyInput]}
                    value={String(item.quantity)}
                    onChangeText={(v) => updateItem(index, { quantity: Number(v) || 0 })}
                    keyboardType="number-pad"
                    placeholder="Qté"
                  />
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    value={String(item.unit_price)}
                    onChangeText={(v) => updateItem(index, { unit_price: Number(v) || 0 })}
                    keyboardType="decimal-pad"
                    placeholder="Prix"
                  />
                </View>
              </View>
            ))}

            <Text style={styles.total}>Total : {formatCurrency(total)}</Text>

            <Pressable
              style={[ownerStyles.primaryBtn, !canSubmit && styles.disabled]}
              disabled={!canSubmit}
              onPress={() => submit(false)}>
              {createOrder.isPending && !updateStatus.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={ownerStyles.primaryBtnText}>Enregistrer la commande</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.secondaryBtn, !canSubmit && styles.disabled]}
              disabled={!canSubmit}
              onPress={() => submit(true)}>
              {updateStatus.isPending ? (
                <ActivityIndicator color={ownerColors.primary} />
              ) : (
                <Text style={styles.secondaryBtnText}>Enregistrer et marquer reçu</Text>
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
    padding: 10,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.bg,
    marginBottom: 6,
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
  scanBtn: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  scanRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  scanText: { fontSize: 14, color: ownerColors.textMuted, fontWeight: "500" },
  linesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addLine: { fontSize: 13, fontWeight: "600", color: ownerColors.primary },
  lineCard: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: ownerColors.bg,
  },
  lineTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  lineNum: { fontSize: 12, fontWeight: "600", color: ownerColors.textDim },
  removeLine: { fontSize: 12, color: ownerColors.danger ?? "#DC2626" },
  productChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    marginRight: 6,
    maxWidth: 120,
  },
  productChipText: { fontSize: 11, color: ownerColors.textMuted },
  row2: { flexDirection: "row", gap: 6 },
  flex1: { flex: 1 },
  qtyInput: { width: 64 },
  priceInput: { width: 80 },
  total: {
    fontSize: 16,
    fontWeight: "700",
    color: ownerColors.text,
    marginVertical: 12,
    textAlign: "right",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: ownerColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  secondaryBtnText: { color: ownerColors.primary, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
