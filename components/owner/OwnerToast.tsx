import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ownerColors } from "@/constants/ownerTheme";

export type OwnerToastVariant = "success" | "error";

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  variant?: OwnerToastVariant;
  durationMs?: number;
  onDismiss: () => void;
}

export function OwnerToast({
  visible,
  title,
  message,
  variant = "success",
  durationMs = 3000,
  onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    translateY.setValue(16);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 80 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 8, duration: 220, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, durationMs);

    return () => clearTimeout(timer);
  }, [visible, durationMs, onDismiss, opacity, translateY]);

  if (!visible) return null;

  const isSuccess = variant === "success";
  const accent = isSuccess ? ownerColors.success : ownerColors.danger;
  const surface = isSuccess ? ownerColors.successMuted : ownerColors.dangerMuted;
  const icon = isSuccess ? "checkmark-circle" : "alert-circle";

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { bottom: insets.bottom + 88, opacity, transform: [{ translateY }] },
      ]}>
      <View style={[styles.card, { backgroundColor: surface, borderColor: accent }]}>
        <View style={[styles.iconWrap, { backgroundColor: ownerColors.card }]}>
          <Ionicons name={icon} size={22} color={accent} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
    elevation: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#1A0F0A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: ownerColors.text,
  },
  message: {
    fontSize: 13,
    color: ownerColors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
});
