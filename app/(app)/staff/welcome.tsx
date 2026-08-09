import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthPrimaryButton } from "@/components/auth/AuthPrimaryButton";
import {
  STAFF_WELCOME_SLIDES,
  staffWelcomeStorageKey,
} from "@/constants/staffWelcome";
import { ownerFonts } from "@/constants/ownerTheme";
import { TYPOGRAPHY } from "@/constants/tokens";
import { useAuthContext } from "@/contexts/AuthContext";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";

export default function StaffWelcomeScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { user } = useAuthContext();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [step, setStep] = useState(0);

  const slide = STAFF_WELCOME_SLIDES[step];
  const heroHeight = Math.round(height * 0.56);

  const finish = async () => {
    if (user?.id) {
      await AsyncStorage.setItem(staffWelcomeStorageKey(user.id), "1");
    }
    router.replace("/(app)/staff/(tabs)/today" as Href);
  };

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar style="light" />

      <ImageBackground
        source={slide.image}
        style={[styles.hero, { height: heroHeight, paddingTop: insets.top + 12 }]}
        resizeMode="cover">
        <View style={styles.heroScrim} pointerEvents="none" />
        <Text style={styles.brand}>Kazione</Text>
      </ImageBackground>

      <View style={styles.panel}>
        <Text style={styles.kicker}>{slide.kicker}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {STAFF_WELCOME_SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive]}
              />
            ))}
          </View>

          {step < STAFF_WELCOME_SLIDES.length - 1 ? (
            <AuthPrimaryButton
              label="Suivant"
              onPress={() => setStep((s) => s + 1)}
            />
          ) : (
            <AuthPrimaryButton
              label="Entrer dans mon espace"
              onPress={() => void finish()}
            />
          )}
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    hero: {
      width: "100%",
      justifyContent: "flex-start",
    },
    heroScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.22)",
    },
    brand: {
      marginLeft: 24,
      fontSize: 12,
      letterSpacing: 3,
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.92)",
      fontFamily: ownerFonts.semiBold,
    },
    panel: {
      flex: 1,
      marginTop: -28,
      backgroundColor: colors.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 8,
    },
    kicker: {
      ...TYPOGRAPHY.caption,
      letterSpacing: 2.4,
      textTransform: "uppercase",
      color: colors.textDim,
      fontFamily: ownerFonts.semiBold,
      marginBottom: 10,
    },
    title: {
      ...TYPOGRAPHY.display,
      fontSize: 28,
      lineHeight: 34,
      fontFamily: ownerFonts.bold,
      color: colors.text,
      marginBottom: 12,
    },
    body: {
      ...TYPOGRAPHY.body,
      fontFamily: ownerFonts.regular,
      color: colors.textMuted,
      flexGrow: 1,
    },
    footer: {
      gap: 18,
      marginTop: 20,
    },
    dots: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
  });
}
