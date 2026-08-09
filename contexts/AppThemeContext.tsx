import { syncOwnerColors } from "@/constants/ownerTheme";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";
export type AccentId =
  | "orange"
  | "indigo"
  | "teal"
  | "rose"
  | "violet"
  | "slate";

export type ThemeColors = {
  bg: string;
  card: string;
  cardWarm: string;
  border: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryMuted: string;
  primarySurface: string;
  text: string;
  textMuted: string;
  textDim: string;
  danger: string;
  dangerMuted: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  avatar: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
};

export const ACCENT_PRESETS: { id: AccentId; label: string; color: string }[] = [
  { id: "orange", label: "Orange", color: "#E84E26" },
  { id: "indigo", label: "Indigo", color: "#5865F2" },
  { id: "teal", label: "Teal", color: "#0D9488" },
  { id: "rose", label: "Rose", color: "#E11D48" },
  { id: "violet", label: "Violet", color: "#7C3AED" },
  { id: "slate", label: "Slate", color: "#475569" },
];

const STORAGE_THEME = "kzione_theme";
const STORAGE_ACCENT = "kzione_accent";

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function lighten(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.min(255, Math.round(r + (255 - r) * amount));
  g = Math.min(255, Math.round(g + (255 - g) * amount));
  b = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function darken(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function buildThemeColors(
  resolved: "light" | "dark",
  accentId: AccentId,
): ThemeColors {
  const accent =
    ACCENT_PRESETS.find((p) => p.id === accentId)?.color ?? "#E84E26";

  if (resolved === "dark") {
    return {
      bg: "#121212",
      card: "#1C1C1E",
      cardWarm: "#241914",
      border: "#2C2C2E",
      primary: accent,
      primaryLight: lighten(accent, 0.2),
      primaryDark: darken(accent, 0.15),
      primaryMuted: withAlpha(accent, 0.18),
      primarySurface: withAlpha(accent, 0.12),
      text: "#F5F5F5",
      textMuted: "#A1A1AA",
      textDim: "#71717A",
      danger: "#F87171",
      dangerMuted: "rgba(248,113,113,0.15)",
      success: "#4ADE80",
      successMuted: "rgba(74,222,128,0.15)",
      warning: "#FBBF24",
      warningMuted: "rgba(251,191,36,0.15)",
      avatar: accent,
      tabBar: "#1C1C1E",
      tabBarBorder: "#2C2C2E",
      tabBarActive: accent,
      tabBarInactive: "#71717A",
    };
  }

  return {
    bg: "#FFFFFF",
    card: "#FFFFFF",
    cardWarm: "#FDF3F0",
    border: "#F0DDD8",
    primary: accent,
    primaryLight: lighten(accent, 0.18),
    primaryDark: darken(accent, 0.12),
    primaryMuted: withAlpha(accent, 0.1),
    primarySurface: withAlpha(accent, 0.06),
    text: "#1A0F0A",
    textMuted: "#6B4C42",
    textDim: "#9B7B72",
    danger: "#B91C1C",
    dangerMuted: "#FEE2E2",
    success: "#2D7A4F",
    successMuted: "#DCFCE7",
    warning: "#D97706",
    warningMuted: "#FEF9C3",
    avatar: accent,
    tabBar: "#FFFFFF",
    tabBarBorder: "#F0DDD8",
    tabBarActive: accent,
    tabBarInactive: "#9B7B72",
  };
}

interface AppThemeContextValue {
  mode: ThemeMode;
  accent: AccentId;
  resolvedMode: "light" | "dark";
  colors: ThemeColors;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: AccentId) => void;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [accent, setAccentState] = useState<AccentId>("orange");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const [storedTheme, storedAccent] = await Promise.all([
        AsyncStorage.getItem(STORAGE_THEME),
        AsyncStorage.getItem(STORAGE_ACCENT),
      ]);
      if (
        storedTheme === "light" ||
        storedTheme === "dark" ||
        storedTheme === "system"
      ) {
        setModeState(storedTheme);
      }
      if (storedAccent && ACCENT_PRESETS.some((p) => p.id === storedAccent)) {
        setAccentState(storedAccent as AccentId);
      }
      setReady(true);
    })();
  }, []);

  const resolvedMode: "light" | "dark" =
    mode === "system" ? (system === "dark" ? "dark" : "light") : mode;

  const colors = useMemo(
    () => buildThemeColors(resolvedMode, accent),
    [resolvedMode, accent],
  );

  useEffect(() => {
    syncOwnerColors(colors);
  }, [colors]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    void AsyncStorage.setItem(STORAGE_THEME, m);
  }, []);

  const setAccent = useCallback((a: AccentId) => {
    setAccentState(a);
    void AsyncStorage.setItem(STORAGE_ACCENT, a);
  }, []);

  // Keep Appearance listener warm when mode is system (hook already tracks)
  useEffect(() => {
    if (mode !== "system") return;
    const sub = Appearance.addChangeListener(() => {
      // useColorScheme updates; force noop to keep listeners attached
    });
    return () => sub.remove();
  }, [mode]);

  const value = useMemo(
    () => ({ mode, accent, resolvedMode, colors, setMode, setAccent }),
    [mode, accent, resolvedMode, colors, setMode, setAccent],
  );

  if (!ready) return null;

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used inside AppThemeProvider");
  return ctx;
}

export function useThemeColors(): ThemeColors {
  return useAppTheme().colors;
}
