/** Mutable palette — updated by AppThemeProvider so ownerStyles getters stay live. */
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

export function syncOwnerColors(next: typeof ownerColors) {
  Object.assign(ownerColors, next);
  ownerDrawerColors.accent = next.primary;
}

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

/**
 * Theme-aware base styles (getters re-read ownerColors on each access).
 * Call useThemeColors() in the screen so React re-renders when theme changes.
 */
export const ownerStyles = {
  get screen() {
    return {
      flex: 1 as const,
      backgroundColor: ownerColors.bg,
    };
  },
  get card() {
    return {
      backgroundColor: ownerColors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: ownerColors.border,
      padding: 16,
    };
  },
  get sectionTitle() {
    return {
      fontSize: 13,
      fontWeight: "600" as const,
      color: ownerColors.textDim,
      textTransform: "uppercase" as const,
      letterSpacing: 1,
      marginBottom: 10,
      marginTop: 8,
      fontFamily: ownerFonts.semiBold,
    };
  },
  get rowTitle() {
    return {
      fontSize: 16,
      fontWeight: "600" as const,
      color: ownerColors.text,
      fontFamily: ownerFonts.semiBold,
    };
  },
  get rowSub() {
    return {
      fontSize: 14,
      color: ownerColors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    };
  },
  get primaryBtn() {
    return {
      backgroundColor: ownerColors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center" as const,
    };
  },
  get primaryBtnText() {
    return {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600" as const,
      fontFamily: ownerFonts.semiBold,
    };
  },
  get outlineBtn() {
    return {
      borderWidth: 1,
      borderColor: ownerColors.primary,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center" as const,
    };
  },
  get outlineBtnText() {
    return {
      color: ownerColors.primary,
      fontSize: 15,
      fontWeight: "600" as const,
      fontFamily: ownerFonts.semiBold,
    };
  },
  get searchInput() {
    return {
      borderWidth: 1,
      borderColor: ownerColors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: ownerColors.card,
      marginBottom: 12,
      color: ownerColors.text,
      fontFamily: ownerFonts.regular,
    };
  },
};
