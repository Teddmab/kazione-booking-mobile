import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ownerColors } from "@/constants/ownerTheme";
import { useCreateBusiness } from "@/hooks/useCreateBusiness";
import { useTenantContext } from "@/contexts/TenantContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Open directly on the create form (sidebar + button). */
  startOnCreate?: boolean;
}

export function BusinessSwitcherSheet({ visible, onClose, startOnCreate = false }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { tenant, businesses, setActiveBusiness } = useTenantContext();
  const createBusiness = useCreateBusiness();
  const [createMode, setCreateMode] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (visible) setCreateMode(startOnCreate);
  }, [visible, startOnCreate]);

  const reset = () => {
    setCreateMode(startOnCreate);
    setNewName("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const submitCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createBusiness.mutate(
      { business_name: name },
      {
        onSuccess: (res) => {
          void setActiveBusiness(res.business_id);
          close();
        },
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={[styles.overlay, createMode ? styles.overlayCentered : styles.overlayBottom]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}>
        <Pressable style={styles.backdrop} onPress={close} />

        {createMode ? (
          <View style={styles.createCard}>
            <Text style={styles.title}>{t("owner.addBusiness")}</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder={t("owner.businessName")}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submitCreate}
            />
            <Pressable
              style={[styles.primaryBtn, createBusiness.isPending && styles.disabled]}
              disabled={createBusiness.isPending}
              onPress={submitCreate}>
              <Text style={styles.primaryBtnText}>{t("owner.createBusiness")}</Text>
            </Pressable>
            <Pressable onPress={() => setCreateMode(false)} style={styles.linkBtn}>
              <Text style={styles.linkText}>{t("owner.cancel")}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
            <Text style={styles.title}>{t("owner.myBusinesses")}</Text>
            {businesses.map((b) => (
              <Pressable
                key={b.businessId}
                style={styles.row}
                onPress={() => {
                  void setActiveBusiness(b.businessId);
                  close();
                }}>
                <Text style={styles.rowText}>{b.businessName}</Text>
                {b.businessId === tenant?.businessId ? (
                  <Text style={styles.activeMark}>✓</Text>
                ) : null}
              </Pressable>
            ))}
            <Pressable style={styles.addRow} onPress={() => setCreateMode(true)}>
              <Text style={styles.addText}>+ {t("owner.addBusiness")}</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  overlayBottom: { justifyContent: "flex-end" },
  overlayCentered: { justifyContent: "center", paddingHorizontal: 20 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  createCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  title: { fontSize: 18, fontWeight: "700", color: ownerColors.text, marginBottom: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ownerColors.border,
  },
  rowText: { fontSize: 16, color: ownerColors.text },
  activeMark: { color: ownerColors.primary, fontWeight: "700", fontSize: 16 },
  addRow: { marginTop: 16, paddingVertical: 12 },
  addText: { fontSize: 15, fontWeight: "600", color: ownerColors.primary },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.bg,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  disabled: { opacity: 0.7 },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  linkBtn: { alignItems: "center", marginTop: 12 },
  linkText: { color: ownerColors.textMuted, fontSize: 15 },
});
