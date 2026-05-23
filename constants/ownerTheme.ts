import { StyleSheet } from "react-native";

export const ownerColors = {
  bg: "#f9f8f3",
  card: "#ffffff",
  border: "#e8e0d8",
  primary: "#6b5344",
  primaryMuted: "rgba(107, 83, 68, 0.12)",
  accentPeach: "#f3e8df",
  accentPeachIcon: "#e8d5c8",
  text: "#1a1a1a",
  textMuted: "#555",
  textDim: "#888",
  danger: "#b00020",
  success: "#2e7d32",
  successMuted: "#e8f5e9",
  warning: "#b45309",
  warningMuted: "#fff3e0",
  avatar: "#e85d3a",
  tabBar: "#ffffff",
};

/** Dark sidebar (web owner shell) */
export const ownerDrawerColors = {
  bg: "#1a1a1c",
  bgActive: "#2a2a2d",
  border: "#333336",
  text: "#ffffff",
  textMuted: "#9a9aa0",
  icon: "#b0b0b5",
  sectionLabel: "#6e6e73",
  accent: "#e85d3a",
  gold: "#d4a853",
  logoBg: "#2a2620",
};

export const ownerFonts = {
  serif: "Georgia",
};

export const ownerStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ownerColors.bg,
  },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: ownerColors.text,
  },
  rowSub: {
    fontSize: 14,
    color: ownerColors.textMuted,
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: ownerColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  outlineBtnText: {
    color: ownerColors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: ownerColors.card,
    marginBottom: 12,
  },
});
