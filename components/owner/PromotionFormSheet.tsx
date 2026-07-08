import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { OwnerSheetHeader } from "@/components/owner/OwnerSheetHeader";
import { ownerColors, ownerStyles } from "@/constants/ownerTheme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; valid_until: string | null }) => void;
  loading?: boolean;
};

export function PromotionFormSheet({ visible, onClose, onSubmit, loading }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      valid_until: validUntil.trim() || null,
    });
    setTitle("");
    setDescription("");
    setValidUntil("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <OwnerSheetHeader title={t("owner.promoAdd")} onClose={onClose} disabled={loading} />
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t("owner.promoTitle")}
            maxLength={80}
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder={t("owner.promoDescription")}
            multiline
            maxLength={300}
          />
          <TextInput
            style={styles.input}
            value={validUntil}
            onChangeText={setValidUntil}
            placeholder={t("owner.promoValidUntil")}
            autoCapitalize="none"
          />
          <Pressable
            style={[ownerStyles.primaryBtn, loading && styles.disabled]}
            disabled={loading || !title.trim()}
            onPress={submit}>
            <Text style={ownerStyles.primaryBtnText}>{t("owner.save")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: ownerColors.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: "700", color: ownerColors.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.card,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  disabled: { opacity: 0.6 },
});
