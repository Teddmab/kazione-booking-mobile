import * as ImagePicker from "expo-image-picker";
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

import { CategoryPicker } from "@/components/owner/CategoryPicker";
import { SafeImage } from "@/components/SafeImage";
import { ownerColors } from "@/constants/ownerTheme";
import type { ServiceSuggestion } from "@/services/owner/ai";
import type { OwnerServiceRow } from "@/types/owner";
import type { ProductRow } from "@/types/products";
import type { ProductUsageInput } from "@/hooks/useOwnerServices";

const DURATIONS = [15, 30, 45, 60, 75, 90, 120] as const;
const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60] as const;

export interface ServiceFormValues {
  name: string;
  category_name: string;
  duration_minutes: number;
  buffer_minutes: number;
  price: string;
  deposit_amount: string;
  description: string;
  is_active: boolean;
}

interface Props {
  visible: boolean;
  service: OwnerServiceRow | null;
  categorySuggestions: string[];
  defaultCurrency?: string;
  initialStep?: 1 | 2;
  aiSuggestions?: ServiceSuggestion[];
  onClose: () => void;
  onSubmit: (
    values: ServiceFormValues,
    serviceId: string | null,
    localImageUri?: string | null,
    productUsage?: ProductUsageInput[],
  ) => void;
  onDeactivate?: (serviceId: string) => void;
  busy?: boolean;
  // Products for service linking
  products?: ProductRow[];
  initialProductUsage?: ProductUsageInput[];
}

function emptyForm(): ServiceFormValues {
  return {
    name: "",
    category_name: "",
    duration_minutes: 60,
    buffer_minutes: 0,
    price: "",
    deposit_amount: "",
    description: "",
    is_active: true,
  };
}

function renderSuggestion(
  field: ServiceSuggestion["field"],
  suggestions: ServiceSuggestion[],
  onApply: (value: string) => void,
) {
  const hint = suggestions.find((s) => s.field === field);
  if (!hint) return null;
  return (
    <View style={styles.aiHint}>
      <Text style={styles.aiHintText}>
        {hint.suggested_value ? `IA : ${hint.suggested_value}` : hint.reason}
      </Text>
      {hint.suggested_value ? (
        <Pressable onPress={() => onApply(hint.suggested_value!)}>
          <Text style={styles.aiApply}>Appliquer</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ServiceFormSheet({
  visible,
  service,
  categorySuggestions,
  defaultCurrency = "EUR",
  initialStep = 1,
  aiSuggestions = [],
  onClose,
  onSubmit,
  onDeactivate,
  busy,
  products = [],
  initialProductUsage = [],
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<ServiceFormValues>(emptyForm());
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<ProductUsageInput[]>([]);

  useEffect(() => {
    if (!visible) return;
    setStep(initialStep);
    setStepError(null);
    setLocalImageUri(null);
    setSelectedProducts(initialProductUsage);
    if (service) {
      setForm({
        name: service.name,
        category_name: service.category_name ?? "",
        duration_minutes: service.duration_minutes,
        buffer_minutes: service.buffer_minutes ?? 0,
        price: String(service.price),
        deposit_amount:
          service.deposit_amount != null && service.deposit_amount > 0
            ? String(service.deposit_amount)
            : "",
        description: service.description ?? "",
        is_active: service.is_active,
      });
      setExistingImageUrl(service.image_url ?? null);
    } else {
      setForm(emptyForm());
      setExistingImageUrl(null);
    }
  }, [visible, service, initialStep]);

  // Sync when initialProductUsage changes (loaded async)
  useEffect(() => {
    if (visible) setSelectedProducts(initialProductUsage);
  }, [initialProductUsage, visible]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission requise", "Autorisez l'accès aux photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const validateStep1 = (): string | null => {
    if (!form.name.trim()) return "Le nom du service est obligatoire.";
    if (!form.category_name.trim()) return "Choisissez une catégorie.";
    return null;
  };

  const validateStep2 = (): string | null => {
    if (form.duration_minutes < 5 || form.duration_minutes > 480) {
      return "La durée doit être entre 5 et 480 minutes.";
    }
    const price = Number(form.price.replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) {
      return "Indiquez un prix positif.";
    }
    if (form.deposit_amount.trim()) {
      const deposit = Number(form.deposit_amount.replace(",", "."));
      if (!Number.isFinite(deposit) || deposit < 0) {
        return "Le dépôt doit être positif ou nul.";
      }
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep1();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep(2);
  };

  const save = () => {
    const err = validateStep1() ?? validateStep2();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    onSubmit(form, service?.id ?? null, localImageUri, selectedProducts);
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.productId === productId);
      if (exists) return prev.filter((p) => p.productId !== productId);
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const setQty = (productId: string, delta: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? { ...p, quantity: Math.max(0.01, Math.round((p.quantity + delta) * 100) / 100) }
          : p,
      ),
    );
  };

  const previewUri = localImageUri ?? existingImageUrl;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{service ? "Modifier le service" : "Nouveau service"}</Text>
          <Text style={styles.stepLabel}>Étape {step} / 2</Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            {step === 1 ? (
              <>
                <Text style={styles.label}>Nom *</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(name) => setForm((f) => ({ ...f, name }))}
                  placeholder="Ex. Box braids"
                />
                {renderSuggestion("name", aiSuggestions, (value) =>
                  setForm((f) => ({ ...f, name: value })),
                )}

                <CategoryPicker
                  value={form.category_name}
                  onChange={(category_name) => setForm((f) => ({ ...f, category_name }))}
                  suggestions={categorySuggestions}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={form.description}
                  onChangeText={(description) => setForm((f) => ({ ...f, description }))}
                  multiline
                  numberOfLines={3}
                  placeholder="Optionnel"
                />
                {renderSuggestion("description", aiSuggestions, (value) =>
                  setForm((f) => ({ ...f, description: value })),
                )}

                <Text style={styles.label}>Photo</Text>
                {previewUri ? (
                  <SafeImage
                    uri={localImageUri ?? existingImageUrl}
                    style={styles.previewThumb}
                    fallbackLetter={form.name || "?"}
                  />
                ) : null}
                <Pressable style={styles.imageBtn} onPress={() => void pickImage()}>
                  <Text style={styles.imageBtnText}>
                    {previewUri ? "Changer la photo" : "Ajouter une photo"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable onPress={() => setStep(1)} style={styles.backLink}>
                  <Text style={styles.backLinkText}>← Retour</Text>
                </Pressable>

                <Text style={styles.label}>Durée (minutes)</Text>
                <View style={styles.durationRow}>
                  {DURATIONS.map((d) => (
                    <Pressable
                      key={d}
                      style={[styles.chip, form.duration_minutes === d && styles.chipActive]}
                      onPress={() => setForm((f) => ({ ...f, duration_minutes: d }))}>
                      <Text
                        style={[
                          styles.chipText,
                          form.duration_minutes === d && styles.chipTextActive,
                        ]}>
                        {d}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={[styles.input, styles.spacedInput]}
                  value={String(form.duration_minutes)}
                  onChangeText={(value) => {
                    const n = Number(value.replace(/\D/g, ""));
                    if (Number.isFinite(n)) setForm((f) => ({ ...f, duration_minutes: n }));
                  }}
                  keyboardType="number-pad"
                  placeholder="60"
                />
                {renderSuggestion("duration_minutes", aiSuggestions, (value) => {
                  const n = Number(value);
                  if (Number.isFinite(n)) setForm((f) => ({ ...f, duration_minutes: n }));
                })}

                <Text style={styles.label}>Buffer (minutes)</Text>
                <View style={styles.durationRow}>
                  {BUFFER_OPTIONS.map((b) => (
                    <Pressable
                      key={b}
                      style={[styles.chip, form.buffer_minutes === b && styles.chipActive]}
                      onPress={() => setForm((f) => ({ ...f, buffer_minutes: b }))}>
                      <Text
                        style={[
                          styles.chipText,
                          form.buffer_minutes === b && styles.chipTextActive,
                        ]}>
                        {b}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Prix ({defaultCurrency}) *</Text>
                <View style={styles.moneyRow}>
                  <Text style={styles.moneyPrefix}>€</Text>
                  <TextInput
                    style={[styles.input, styles.moneyInput]}
                    value={form.price}
                    onChangeText={(price) => setForm((f) => ({ ...f, price }))}
                    keyboardType="decimal-pad"
                    placeholder="95"
                  />
                </View>
                {renderSuggestion("price", aiSuggestions, (value) =>
                  setForm((f) => ({ ...f, price: value })),
                )}

                <Text style={styles.label}>Dépôt ({defaultCurrency})</Text>
                <View style={styles.moneyRow}>
                  <Text style={styles.moneyPrefix}>€</Text>
                  <TextInput
                    style={[styles.input, styles.moneyInput]}
                    value={form.deposit_amount}
                    onChangeText={(deposit_amount) => setForm((f) => ({ ...f, deposit_amount }))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                </View>

                {/* Products used */}
                {products.length > 0 ? (
                  <>
                    <Text style={styles.label}>Produits utilisés</Text>
                    <Text style={styles.hint}>
                      Stock déduit automatiquement à la fin de chaque rendez-vous.
                    </Text>
                    {products.map((product) => {
                      const sel = selectedProducts.find((p) => p.productId === product.id);
                      const isSelected = !!sel;
                      return (
                        <View key={product.id} style={styles.productRow}>
                          <Pressable
                            style={[styles.checkbox, isSelected && styles.checkboxActive]}
                            onPress={() => toggleProduct(product.id)}
                          />
                          <Pressable
                            style={styles.productInfo}
                            onPress={() => toggleProduct(product.id)}>
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productMeta}>
                              {product.sku ? `${product.sku} · ` : ""}
                              {product.current_stock} {product.unit} en stock
                            </Text>
                          </Pressable>
                          {isSelected ? (
                            <View style={styles.qtyRow}>
                              <Pressable
                                style={styles.qtyBtn}
                                onPress={() => setQty(product.id, -1)}>
                                <Text style={styles.qtyBtnText}>−</Text>
                              </Pressable>
                              <Text style={styles.qtyValue}>{sel?.quantity ?? 1}</Text>
                              <Pressable
                                style={styles.qtyBtn}
                                onPress={() => setQty(product.id, 1)}>
                                <Text style={styles.qtyBtnText}>+</Text>
                              </Pressable>
                              <Text style={styles.qtyUnit}>{product.unit}</Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </>
                ) : null}

                {service ? (
                  <View style={styles.switchRow}>
                    <Text style={styles.labelInline}>Service actif</Text>
                    <Switch
                      value={form.is_active}
                      onValueChange={(is_active) => setForm((f) => ({ ...f, is_active }))}
                      trackColor={{ true: ownerColors.primary }}
                    />
                  </View>
                ) : null}
              </>
            )}

            {stepError ? <Text style={styles.error}>{stepError}</Text> : null}
          </ScrollView>

          {step === 1 ? (
            <Pressable style={styles.primaryBtn} onPress={goNext}>
              <Text style={styles.primaryBtnText}>Suivant →</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.primaryBtn, busy && styles.disabled]}
              disabled={busy}
              onPress={save}>
              <Text style={styles.primaryBtnText}>
                {busy ? "Enregistrement…" : "Enregistrer"}
              </Text>
            </Pressable>
          )}

          {service && onDeactivate && step === 2 ? (
            <Pressable
              style={styles.dangerBtn}
              disabled={busy}
              onPress={() => {
                Alert.alert(
                  "Archiver le service",
                  "Ce service ne sera plus réservable. Continuer ?",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Archiver",
                      style: "destructive",
                      onPress: () => onDeactivate(service.id),
                    },
                  ],
                );
              }}>
              <Text style={styles.dangerText}>Archiver le service</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Annuler</Text>
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
    maxHeight: "90%",
  },
  title: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  stepLabel: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4, marginBottom: 8 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.textDim,
    marginTop: 12,
    marginBottom: 6,
  },
  labelInline: { fontSize: 15, color: ownerColors.text, flex: 1 },
  hint: { fontSize: 12, color: ownerColors.textMuted, marginBottom: 8, marginTop: -2 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: ownerColors.bg,
  },
  spacedInput: { marginTop: 8 },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
  },
  chipActive: { backgroundColor: ownerColors.primaryMuted, borderColor: ownerColors.primary },
  chipText: { fontSize: 14, color: ownerColors.textMuted },
  chipTextActive: { color: ownerColors.primary, fontWeight: "600" },
  previewThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginTop: 6,
    backgroundColor: ownerColors.bg,
  },
  imageBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
  },
  imageBtnText: { fontSize: 14, fontWeight: "600", color: ownerColors.primary },
  moneyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  moneyPrefix: { fontSize: 16, fontWeight: "600", color: ownerColors.textMuted },
  moneyInput: { flex: 1 },
  backLink: { marginTop: 4, marginBottom: 4 },
  backLinkText: { fontSize: 14, fontWeight: "600", color: ownerColors.primary },
  aiHint: {
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  aiHintText: { flex: 1, fontSize: 12, color: "#92400e", lineHeight: 17 },
  aiApply: { fontSize: 12, fontWeight: "700", color: ownerColors.primary },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  // Product rows
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ownerColors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.bg,
  },
  checkboxActive: {
    backgroundColor: ownerColors.primary,
    borderColor: ownerColors.primary,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  productMeta: { fontSize: 11, color: ownerColors.textMuted, marginTop: 1 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ownerColors.bg,
  },
  qtyBtnText: { fontSize: 16, color: ownerColors.primary, fontWeight: "600" },
  qtyValue: { fontSize: 14, fontWeight: "600", color: ownerColors.text, minWidth: 20, textAlign: "center" },
  qtyUnit: { fontSize: 11, color: ownerColors.textMuted },
  error: { fontSize: 13, color: ownerColors.danger, marginTop: 12 },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  dangerBtn: { alignItems: "center", paddingVertical: 12, marginTop: 8 },
  dangerText: { color: ownerColors.danger, fontWeight: "600" },
  cancel: { alignItems: "center", paddingVertical: 10 },
  cancelText: { color: ownerColors.textMuted },
});
