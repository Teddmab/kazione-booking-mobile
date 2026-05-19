import type { ImageStyle, StyleProp, ViewStyle } from "react-native";
import { useState } from "react";
import { Image, View, Text, StyleSheet } from "react-native";

type Props = {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  fallbackLetter: string;
  accessibilityLabel?: string;
};

/** Remote image with letter fallback on error or missing URI (Phase 1 polish). */
export function SafeImage({ uri, style, fallbackLetter, accessibilityLabel }: Props) {
  const [failed, setFailed] = useState(false);
  const letter = fallbackLetter.charAt(0).toUpperCase() || "?";

  if (!uri || failed) {
    return (
      <View style={[styles.ph, style as StyleProp<ViewStyle>]} accessibilityLabel={accessibilityLabel}>
        <Text style={styles.phText}>{letter}</Text>
      </View>
    );
  }

  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      source={{ uri }}
      style={style}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  ph: {
    backgroundColor: "#e8dfd6",
    alignItems: "center",
    justifyContent: "center",
  },
  phText: { fontSize: 28, fontWeight: "700", color: "#6b5344" },
});
