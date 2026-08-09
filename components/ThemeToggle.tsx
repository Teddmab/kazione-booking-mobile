import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  ACCENT_PRESETS,
  useAppTheme,
  type ThemeMode,
} from "@/contexts/AppThemeContext";
import { ownerFonts } from "@/constants/ownerTheme";

const MODES: { id: ThemeMode; icon: keyof typeof Ionicons.glyphMap; labelKey: string }[] = [
  { id: "light", icon: "sunny-outline", labelKey: "appearance.light" },
  { id: "dark", icon: "moon-outline", labelKey: "appearance.dark" },
  { id: "system", icon: "phone-portrait-outline", labelKey: "appearance.system" },
];

export function ThemeToggle() {
  const { t } = useTranslation();
  const { mode, accent, colors, setMode, setAccent } = useAppTheme();

  return (
    <View style={styles.root}>
      <Text style={[styles.sectionLabel, { color: colors.text }]}>
        {t("appearance.mode")}
      </Text>
      <View style={styles.modeRow}>
        {MODES.map((item) => {
          const active = mode === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setMode(item.id)}
              style={[
                styles.modeBtn,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primaryMuted : colors.card,
                },
              ]}>
              <Ionicons
                name={item.icon}
                size={20}
                color={active ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.modeLabel,
                  { color: active ? colors.primary : colors.textMuted },
                ]}>
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 18 }]}>
        {t("appearance.accent")}
      </Text>
      <View style={styles.accentWrap}>
        {ACCENT_PRESETS.map((preset) => {
          const active = accent === preset.id;
          return (
            <Pressable
              key={preset.id}
              onPress={() => setAccent(preset.id)}
              style={[
                styles.accentBtn,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primaryMuted : colors.card,
                },
              ]}>
              <View
                style={[styles.accentDot, { backgroundColor: preset.color }]}
              />
              <Text
                style={[
                  styles.accentLabel,
                  { color: active ? colors.primary : colors.text },
                ]}>
                {preset.label}
              </Text>
              {active ? (
                <Text style={{ color: colors.primary, fontWeight: "700" }}>✓</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  sectionLabel: {
    fontSize: 14,
    fontFamily: ownerFonts.semiBold,
  },
  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  modeLabel: {
    fontSize: 12,
    fontFamily: ownerFonts.medium,
  },
  accentWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  accentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: "47%",
    flexGrow: 1,
  },
  accentDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  accentLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: ownerFonts.medium,
  },
});
