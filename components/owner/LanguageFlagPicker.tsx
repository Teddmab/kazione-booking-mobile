import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import { useLanguage } from "@/hooks/useLanguage";

const LANGUAGES = [
  { code: "en", flag: "🇬🇧", labelKey: "owner.langEn" },
  { code: "fr", flag: "🇫🇷", labelKey: "owner.langFr" },
  { code: "et", flag: "🇪🇪", labelKey: "owner.langEt" },
] as const;

export function LanguageFlagPicker() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const current =
    LANGUAGES.find((l) => language.startsWith(l.code)) ?? LANGUAGES[0];

  const pick = (code: string) => {
    void setLanguage(code);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityLabel={t("owner.selectLanguage")}
        accessibilityRole="button">
        <Text style={styles.flag}>{current.flag}</Text>
        <Ionicons name="chevron-down" size={14} color={ownerColors.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.dropdownWrap}>
            <Pressable style={styles.dropdown} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.dropdownTitle}>{t("owner.selectLanguage")}</Text>
              {LANGUAGES.map((lang) => {
                const active = language.startsWith(lang.code);
                return (
                  <Pressable
                    key={lang.code}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => pick(lang.code)}>
                    <Text style={styles.optionFlag}>{lang.flag}</Text>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                      {t(lang.labelKey)}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark" size={18} color={ownerColors.primary} />
                    ) : (
                      <View style={styles.checkPlaceholder} />
                    )}
                  </Pressable>
                );
              })}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    minHeight: 36,
  },
  flag: { fontSize: 18 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 56,
    paddingRight: 72,
  },
  dropdownWrap: {
    maxWidth: 220,
    width: "100%",
  },
  dropdown: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  dropdownTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionActive: { backgroundColor: ownerColors.primaryMuted },
  optionFlag: { fontSize: 20 },
  optionLabel: { flex: 1, fontSize: 15, color: ownerColors.text },
  optionLabelActive: { fontWeight: "600", color: ownerColors.primary },
  checkPlaceholder: { width: 18 },
});
