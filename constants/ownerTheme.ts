import { StyleSheet } from "react-native";

export const ownerColors = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  cardWarm: "#FDF3F0",
  border: "#F0DDD8",
  primary: "#E84E26",
  primaryLight: "#F06540",
  primaryDark: "#C43D1A",
  primaryMuted: "rgba(232, 78, 38, 0.10)",
  primarySurface: "#FFF8F6",
  text: "#1A0F0A",
  textMuted: "#6B4C42",
  textDim: "#9B7B72",
  danger: "#B91C1C",
  dangerMuted: "#FEE2E2",
  success: "#2D7A4F",
  successMuted: "#DCFCE7",
  warning: "#D97706",
  warningMuted: "#FEF9C3",
  avatar: "#E84E26",
  tabBar: "#FFFFFF",
  tabBarBorder: "#F0DDD8",
  tabBarActive: "#E84E26",
  tabBarInactive: "#9B7B72",
};

/** Dark sidebar (owner shell drawer) */
export const ownerDrawerColors = {
  bg: "#1A0F0A",
  bgActive: "#2A1510",
  border: "#3A2015",
  text: "#F5F5F5",
  textMuted: "#9B7B72",
  icon: "#C0B0A8",
  sectionLabel: "#6B4C42",
  accent: "#E84E26",
  logoBg: "#2A1510",
};

export const ownerFonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold",
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
    fontFamily: ownerFonts.semiBold,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: ownerColors.text,
    fontFamily: ownerFonts.semiBold,
  },
  rowSub: {
    fontSize: 14,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  primaryBtn: {
    backgroundColor: "#E84E26",
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
    borderColor: ownerColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  outlineBtnText: {
    color: ownerColors.primary,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
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
    fontFamily: ownerFonts.regular,
  },
});
