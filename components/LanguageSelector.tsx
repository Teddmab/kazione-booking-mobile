import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";

export const APP_LANGUAGES = [
  { code: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "fr", label: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "et", label: "Estonian", nativeName: "Eesti", flag: "🇪🇪" },
  { code: "ru", label: "Russian", nativeName: "Русский", flag: "🇷🇺" },
] as const;

type Variant = "compact" | "list";

interface Props {
  variant?: Variant;
  /** Dark drawer footer styling */
  tone?: "default" | "drawer";
}

export function LanguageSelector({ variant = "compact", tone = "default" }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = useMemo(
    () =>
      APP_LANGUAGES.find((l) => language.startsWith(l.code)) ?? APP_LANGUAGES[0],
    [language],
  );

  if (variant === "list") {
    return (
      <View style={styles.list}>
        {APP_LANGUAGES.map((lang) => {
          const active = language.startsWith(lang.code);
          return (
            <Pressable
              key={lang.code}
              onPress={() => void setLanguage(lang.code)}
              style={[
                styles.listRow,
                active && { backgroundColor: colors.primaryMuted },
              ]}>
              <Text style={styles.listFlag}>{lang.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.listNative}>{lang.nativeName}</Text>
                {lang.nativeName !== lang.label ? (
                  <Text style={styles.listLabel}>{lang.label}</Text>
                ) : null}
              </View>
              {active ? (
                <Text style={styles.check}>✓</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  }

  const isDrawer = tone === "drawer";

  return (
    <>
      <Pressable
        style={[styles.compactBtn, isDrawer && styles.compactBtnDrawer]}
        onPress={() => setOpen(true)}
        accessibilityLabel={t("staffNav.changeLanguage")}
        accessibilityRole="button">
        <Text style={styles.compactFlag}>{current.flag}</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            {APP_LANGUAGES.map((lang) => {
              const active = language.startsWith(lang.code);
              return (
                <Pressable
                  key={lang.code}
                  style={[styles.menuRow, active && styles.menuRowActive]}
                  onPress={() => {
                    void setLanguage(lang.code);
                    setOpen(false);
                  }}>
                  <Text style={styles.listFlag}>{lang.flag}</Text>
                  <Text style={[styles.menuText, active && styles.menuTextActive]}>
                    {lang.nativeName}
                  </Text>
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    compactBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    compactBtnDrawer: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.border,
    },
    compactFlag: { fontSize: 18 },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
      padding: 16,
    },
    menu: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 6,
      marginBottom: 24,
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    menuRowActive: { backgroundColor: colors.primaryMuted },
    menuText: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      fontFamily: ownerFonts.medium,
    },
    menuTextActive: {
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    list: { gap: 2 },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    listFlag: { fontSize: 20 },
    listNative: {
      fontSize: 14,
      color: colors.text,
      fontFamily: ownerFonts.medium,
    },
    listLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    check: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: "700",
    },
  });
}
