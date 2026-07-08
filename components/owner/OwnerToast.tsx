import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";

export type OwnerToastVariant = "success" | "error" | "warning";

interface VariantStyle {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  surface: string;
}

const VARIANT_STYLES: Record<OwnerToastVariant, VariantStyle> = {
  success: {
    icon: "checkmark-circle",
    iconColor: ownerColors.success,
    surface: ownerColors.successMuted,
  },
  error: {
    icon: "alert-circle",
    iconColor: ownerColors.danger,
    surface: ownerColors.dangerMuted,
  },
  warning: {
    icon: "warning",
    iconColor: ownerColors.warning,
    surface: ownerColors.warningMuted,
  },
};

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
  const translateY = useRef(new Animated.Value(-10)).current;
  const variantStyle = VARIANT_STYLES[variant];

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    translateY.setValue(-10);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -8, duration: 180, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, durationMs);

    return () => clearTimeout(timer);
  }, [visible, durationMs, onDismiss, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          top: insets.top + 8,
          opacity,
          transform: [{ translateY }],
        },
      ]}>
      <View style={[styles.card, { backgroundColor: variantStyle.surface }]}>
        <Ionicons name={variantStyle.icon} size={20} color={variantStyle.iconColor} />
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {message ? (
            <Text style={styles.message} numberOfLines={3}>
              {message}
            </Text>
          ) : null}
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
    zIndex: 9999,
    elevation: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#1A0F0A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  textBlock: { flex: 1, minWidth: 0, paddingTop: 1 },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: ownerColors.text,
    fontFamily: ownerFonts.semiBold,
    lineHeight: 20,
  },
  message: {
    fontSize: 13,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.regular,
    marginTop: 2,
    lineHeight: 18,
  },
});
