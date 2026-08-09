import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { GRID_START_HOUR, GRID_HOURS, HOUR_PX, TOTAL_PX } from "@/lib/staffCalendar";

function nowTopPx(): number {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes() - GRID_START_HOUR * 60;
  return Math.max(0, Math.min((m / 60) * HOUR_PX, TOTAL_PX));
}

export function NowLine() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [top, setTop] = useState(nowTopPx);

  useEffect(() => {
    const id = setInterval(() => setTop(nowTopPx()), 60_000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  const hour = now.getHours();
  if (hour < GRID_START_HOUR || hour >= GRID_START_HOUR + GRID_HOURS) {
    return null;
  }

  return (
    <View style={[styles.container, { top }]} pointerEvents="none">
      <View style={styles.dot} />
      <View style={styles.line} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      position: "absolute",
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 20,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginLeft: -4,
    },
    line: { flex: 1, height: 1.5, backgroundColor: colors.primary },
  });
}
