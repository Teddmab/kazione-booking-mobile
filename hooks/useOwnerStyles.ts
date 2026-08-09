import { useMemo } from "react";
import { StyleSheet, type ViewStyle, type TextStyle } from "react-native";

import {
  useThemeColors,
  type ThemeColors,
} from "@/contexts/AppThemeContext";
import { ownerFonts } from "@/constants/ownerTheme";

type OwnerStyleSheet = {
  screen: ViewStyle;
  card: ViewStyle;
  sectionTitle: TextStyle;
  rowTitle: TextStyle;
  rowSub: TextStyle;
  primaryBtn: ViewStyle;
  primaryBtnText: TextStyle;
  outlineBtn: ViewStyle;
  outlineBtnText: TextStyle;
  searchInput: TextStyle;
};

export function makeOwnerStyles(colors: ThemeColors): OwnerStyleSheet {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textDim,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10,
      marginTop: 8,
      fontFamily: ownerFonts.semiBold,
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    rowSub: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    outlineBtn: {
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    outlineBtnText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: colors.card,
      marginBottom: 12,
      color: colors.text,
      fontFamily: ownerFonts.regular,
    },
  });
}

export function useOwnerStyles() {
  const colors = useThemeColors();
  return useMemo(() => makeOwnerStyles(colors), [colors]);
}
