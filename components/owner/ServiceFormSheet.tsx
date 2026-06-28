import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { OwnerSheetHeader } from "@/components/owner/OwnerSheetHeader";
import { SafeImage } from "@/components/SafeImage";
import { ownerColors } from "@/constants/ownerTheme";
import { useToast } from "@/contexts/ToastContext";
import type { ProductUsageInput } from "@/hooks/useOwnerServices";
import type { ServiceSuggestion } from "@/services/owner/ai";
import { uploadServiceImage } from "@/services/owner/services";
import type { OwnerServiceRow, StaffCommissionType } from "@/types/owner";
import type { ProductRow } from "@/types/products";

const DURATIONS = [15, 30, 45, 60, 75, 90, 120] as const;
const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60] as const;
const IMAGE_FIELDS = ["image_url", "image_url_2", "image_url_3"] as const;
type ImageField = (typeof IMAGE_FIELDS)[number];
type FormStep = 1 | 2 | 3 | 4;

const STEP_LABELS = ["Infos", "Tarifs", "Photos", "Produits"] as const;

const COMMISSION_TYPES: { value: StaffCommissionType; label: string }[] = [
  { value: "none", label: "Aucune" },
  { value: "percentage", label: "% du prix" },
  { value: "fixed", label: "Montant fixe" },
];

export type StaffCommissionType = "none" | "percentage" | "fixed";

export interface ServiceFormValues {
  name: string;
  category_name: string;
  duration_minutes: number;
  buffer_minutes: number;
  price: string;
  deposit_amount: string;
  description: string;
  is_active: boolean;
  staff_commission_type: StaffCommissionType;
  staff_commission_value: string;
  image_url: string;
  image_url_2: string;
  image_url_3: string;
}

interface Props {
  visible: boolean;
  businessId: string;
  service: OwnerServiceRow | null;
  categorySuggestions: string[];
  defaultCurrency?: string;
  initialStep?: FormStep;
  aiSuggestions?: ServiceSuggestion[];
  onClose: () => void;
  onSaveService: (values: ServiceFormValues, serviceId: string | null) => Promise<string>;
  onFinishProducts: (serviceId: string, productUsage: ProductUsageInput[]) => void;
  onDeactivate?: (serviceId: string) => void;
  saving?: boolean;
  syncingProducts?: boolean;
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
    staff_commission_type: "none",
    staff_commission_value: "",
    image_url: "",
    image_url_2: "",
    image_url_3: "",
  };
}

function toFormState(row: OwnerServiceRow): ServiceFormValues {
  return {
    name: row.name,
    category_name: row.category_name ?? "",
    duration_minutes: row.duration_minutes,
    buffer_minutes: row.buffer_minutes ?? 0,
    price: String(row.price),
    deposit_amount:
      row.deposit_amount != null && row.deposit_amount > 0 ? String(row.deposit_amount) : "",
    description: row.description ?? "",
    is_active: row.is_active,
    staff_commission_type: row.staff_commission_type ?? "none",
    staff_commission_value:
      row.staff_commission_value != null ? String(row.staff_commission_value) : "",
    image_url: row.image_url ?? "",
    image_url_2: row.image_url_2 ?? "",
    image_url_3: row.image_url_3 ?? "",
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
  businessId,
  service,
  categorySuggestions,
  defaultCurrency = "EUR",
  initialStep = 1,
  aiSuggestions = [],
  onClose,
  onSaveService,
  onFinishProducts,
  onDeactivate,
  saving,
  syncingProducts,
  products = [],
  initialProductUsage = [],
}: Props) {
  const toast = useToast();
  const [step, setStep] = useState<FormStep>(1);
  const [form, setForm] = useState<ServiceFormValues>(emptyForm());
  const [stepError, setStepError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<ProductUsageInput[]>([]);
  const [savedServiceId, setSavedServiceId] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<ImageField | null>(null);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    const justOpened = visible && !wasVisibleRef.current;
    wasVisibleRef.current = visible;

    if (!visible) return;

    if (justOpened) {
      setStep(initialStep);
      setStepError(null);
      setSelectedProducts(initialProductUsage);
      setSavedServiceId(service?.id ?? null);
      setUploadingField(null);
      setForm(service ? toFormState(service) : emptyForm());
    }
  }, [visible, service, initialStep, initialProductUsage]);

  useEffect(() => {
    if (!visible || step !== 4) return;
    setSelectedProducts((prev) => (prev.length > 0 ? prev : initialProductUsage));
  }, [visible, step, initialProductUsage]);

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
    if (form.staff_commission_type !== "none") {
      const commission = Number(form.staff_commission_value.replace(",", "."));
      if (!Number.isFinite(commission) || commission <= 0) {
        return "Indiquez une commission staff positive.";
      }
      if (form.staff_commission_type === "percentage" && commission > 100) {
        return "Le pourcentage ne peut pas dépasser 100 %.";
      }
    }
    return null;
  };

  const validateCore = (): string | null => validateStep1() ?? validateStep2();

  const goNext = () => {
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null;
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, 4) as FormStep);
  };

  const goBack = () => {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 1) as FormStep);
  };

  const pickImage = async (field: ImageField) => {
    if (!businessId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.warning("Permission requise", "Autorisez l'accès aux photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [4, 3],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingField(field);
    try {
      const publicUrl = await uploadServiceImage(businessId, result.assets[0].uri);
      setForm((f) => ({ ...f, [field]: publicUrl }));
    } catch (err) {
      toast.error("Upload échoué", err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setUploadingField(null);
    }
  };

  const clearImage = (field: ImageField) => {
    setForm((f) => ({ ...f, [field]: "" }));
  };

  const saveAndContinue = async () => {
    const err = validateCore();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    try {
      const id = await onSaveService(form, service?.id ?? savedServiceId);
      setSavedServiceId(id);
      setStep(4);
    } catch (err) {
      setStepError(err instanceof Error ? err.message : "Enregistrement échoué");
    }
  };

  const finish = () => {
    const serviceId = savedServiceId ?? service?.id;
    if (!serviceId) {
      onClose();
      return;
    }
    onFinishProducts(serviceId, selectedProducts);
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

  const priceNum = Number(form.price.replace(",", "."));
  const commissionPreview =
    form.staff_commission_type !== "none" && Number.isFinite(priceNum) && priceNum > 0
      ? form.staff_commission_type === "percentage"
        ? (priceNum * Number(form.staff_commission_value.replace(",", ".")) || 0) / 100
        : Number(form.staff_commission_value.replace(",", ".")) || 0
      : null;

  const busy = saving || syncingProducts || !!uploadingField;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <OwnerSheetHeader
            title={service ? "Modifier le service" : "Nouveau service"}
            onClose={onClose}
            disabled={busy}
            style={styles.sheetHeader}
          />
          <Text style={styles.stepLabel}>
            Étape {step} / 4 — {STEP_LABELS[step - 1]}
          </Text>

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
              </>
            ) : null}

            {step === 2 ? (
              <>
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

                <Text style={styles.label}>Commission staff</Text>
                <View style={styles.durationRow}>
                  {COMMISSION_TYPES.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.chip,
                        form.staff_commission_type === opt.value && styles.chipActive,
                      ]}
                      onPress={() =>
                        setForm((f) => ({
                          ...f,
                          staff_commission_type: opt.value,
                          staff_commission_value:
                            opt.value === "none" ? "" : f.staff_commission_value,
                        }))
                      }>
                      <Text
                        style={[
                          styles.chipText,
                          form.staff_commission_type === opt.value && styles.chipTextActive,
                        ]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {form.staff_commission_type !== "none" ? (
                  <>
                    <Text style={styles.label}>
                      {form.staff_commission_type === "percentage"
                        ? "Taux (%)"
                        : `Montant (${defaultCurrency})`}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={form.staff_commission_value}
                      onChangeText={(staff_commission_value) =>
                        setForm((f) => ({ ...f, staff_commission_value }))
                      }
                      keyboardType="decimal-pad"
                      placeholder={form.staff_commission_type === "percentage" ? "40" : "15.00"}
                    />
                    {commissionPreview != null && commissionPreview > 0 ? (
                      <Text style={styles.commissionHint}>
                        Gain staff estimé : €{commissionPreview.toFixed(2)} par réservation
                      </Text>
                    ) : null}
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
            ) : null}

            {step === 3 ? (
              <>
                <Text style={styles.label}>Photos du service</Text>
                <Text style={styles.hint}>
                  Jusqu&apos;à 3 photos. La première est la couverture sur la vitrine.
                </Text>
                <View style={styles.imageGrid}>
                  {IMAGE_FIELDS.map((field, index) => {
                    const uri = form[field];
                    const isUploading = uploadingField === field;
                    return (
                      <View key={field} style={styles.imageSlot}>
                        <Text style={styles.imageSlotLabel}>
                          {index === 0 ? "Couverture" : `Photo ${index + 1}`}
                        </Text>
                        <Pressable
                          style={styles.imageTile}
                          onPress={() => void pickImage(field)}
                          disabled={isUploading || busy}>
                          {uri ? (
                            <SafeImage uri={uri} style={styles.imagePreview} fallbackLetter="?" />
                          ) : (
                            <View style={styles.imagePlaceholder}>
                              <Ionicons name="image-outline" size={28} color={ownerColors.textDim} />
                              <Text style={styles.imagePlaceholderText}>Ajouter</Text>
                            </View>
                          )}
                          {isUploading ? (
                            <View style={styles.imageLoading}>
                              <ActivityIndicator color={ownerColors.primary} />
                            </View>
                          ) : null}
                          {uri ? (
                            <Pressable
                              style={styles.imageRemove}
                              onPress={() => clearImage(field)}
                              hitSlop={8}>
                              <Ionicons name="close-circle" size={22} color={ownerColors.danger} />
                            </Pressable>
                          ) : null}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <Text style={styles.label}>Produits utilisés</Text>
                <Text style={styles.hint}>
                  Stock déduit automatiquement à la fin de chaque rendez-vous.
                </Text>
                {products.length === 0 ? (
                  <Text style={styles.emptyProducts}>Aucun produit dans le catalogue.</Text>
                ) : (
                  products.map((product) => {
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
                            <Pressable style={styles.qtyBtn} onPress={() => setQty(product.id, -1)}>
                              <Text style={styles.qtyBtnText}>−</Text>
                            </Pressable>
                            <Text style={styles.qtyValue}>{sel?.quantity ?? 1}</Text>
                            <Pressable style={styles.qtyBtn} onPress={() => setQty(product.id, 1)}>
                              <Text style={styles.qtyBtnText}>+</Text>
                            </Pressable>
                            <Text style={styles.qtyUnit}>{product.unit}</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })
                )}
              </>
            ) : null}

            {stepError ? <Text style={styles.error}>{stepError}</Text> : null}
          </ScrollView>

          <View style={styles.footerRow}>
            {step > 1 && step < 4 ? (
              <Pressable style={styles.secondaryBtn} onPress={goBack} disabled={busy}>
                <Text style={styles.secondaryBtnText}>← Retour</Text>
              </Pressable>
            ) : null}

            {step < 3 ? (
              <Pressable
                style={[styles.primaryBtn, styles.footerBtnFlex, busy && styles.disabled]}
                disabled={busy}
                onPress={goNext}>
                <Text style={styles.primaryBtnText}>Suivant →</Text>
              </Pressable>
            ) : step === 3 ? (
              <Pressable
                style={[styles.primaryBtn, styles.footerBtnFlex, busy && styles.disabled]}
                disabled={busy}
                onPress={() => void saveAndContinue()}>
                <Text style={styles.primaryBtnText}>
                  {saving ? "Enregistrement…" : "Enregistrer et continuer"}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.primaryBtn, styles.footerBtnFlex, busy && styles.disabled]}
                disabled={busy}
                onPress={finish}>
                <Text style={styles.primaryBtnText}>
                  {syncingProducts ? "Enregistrement…" : "Terminer"}
                </Text>
              </Pressable>
            )}
          </View>

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
  title: { fontSize: 20, fontWeight: "700", color: ownerColors.text },
  sheetHeader: { marginBottom: 0 },
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
  imageGrid: { flexDirection: "row", gap: 10 },
  imageSlot: { flex: 1, minWidth: 0 },
  imageSlotLabel: { fontSize: 11, color: ownerColors.textMuted, marginBottom: 6 },
  imageTile: {
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderStyle: "dashed",
    overflow: "hidden",
    backgroundColor: ownerColors.bg,
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  imagePlaceholderText: { fontSize: 10, color: ownerColors.textDim },
  imageLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageRemove: { position: "absolute", top: 4, right: 4 },
  moneyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  moneyPrefix: { fontSize: 16, fontWeight: "600", color: ownerColors.textMuted },
  moneyInput: { flex: 1 },
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
  commissionHint: { fontSize: 12, color: "#166534", marginTop: 6 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  emptyProducts: { fontSize: 14, color: ownerColors.textMuted, paddingVertical: 16 },
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
  footerRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  footerBtnFlex: { flex: 1 },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600", color: ownerColors.primary },
  disabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  dangerBtn: { alignItems: "center", paddingVertical: 12, marginTop: 8 },
  dangerText: { color: ownerColors.danger, fontWeight: "600" },
});
