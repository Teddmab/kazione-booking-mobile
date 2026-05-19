import { StyleSheet } from "react-native";

export const ownerColors = {
  bg: "#faf8f5",
  card: "#ffffff",
  border: "#e8e0d8",
  primary: "#6b5344",
  primaryMuted: "rgba(107, 83, 68, 0.12)",
  text: "#1a1a1a",
  textMuted: "#555",
  textDim: "#888",
  danger: "#b00020",
  success: "#2e7d32",
  warning: "#b45309",
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
