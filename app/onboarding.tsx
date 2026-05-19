import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ONBOARDING_STORAGE_KEY } from "@/constants/onboarding";

const MARKETPLACE = require("../assets/images/onboarding/marketplace-hero.jpg");
const SALON_COVER = require("../assets/images/onboarding/salon-afrotouch-cover.jpg");
const DASHBOARD = require("../assets/images/onboarding/hero-dashboard.jpg");

const slides = [
  {
    image: MARKETPLACE,
    title: "Book beauty & wellness",
    body: "Discover salons, choose services, and book a time that fits you — same marketplace as the web app.",
  },
  {
    image: SALON_COVER,
    title: "One account",
    body: "Clients book appointments. Salon teams manage the business from dedicated dashboards.",
  },
  {
    image: DASHBOARD,
    title: "Let's go",
    body: "Sign in or create an account to continue. You will use the same backend as Kazione Booking.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    router.replace("/");
  };

  const slide = slides[step];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground source={slide.image} style={styles.bg} resizeMode="cover">
        <View style={styles.overlayStrong} pointerEvents="none" />
        <View style={styles.overlaySoft} pointerEvents="none" />
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
          <View style={styles.inner}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              <Text style={styles.kicker}>Kazione</Text>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.body}>{slide.body}</Text>
            </ScrollView>

            <View style={styles.bottom}>
              <View style={styles.dots}>
                {slides.map((_, i) => (
                  <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
                ))}
              </View>

              {step < slides.length - 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next slide"
                  style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
                  onPress={() => setStep((s) => s + 1)}>
                  <Text style={styles.primaryText}>Next</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Get started"
                  style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
                  onPress={() => void finish()}>
                  <Text style={styles.primaryText}>Get started</Text>
                </Pressable>
              )}
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  bg: {
    flex: 1,
    width: "100%",
  },
  overlayStrong: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  overlaySoft: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(107, 83, 68, 0.18)",
  },
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  kicker: {
    fontSize: 13,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(212, 181, 140, 0.95)",
    fontWeight: "600",
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 36,
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(255,255,255,0.72)",
  },
  bottom: {
    paddingBottom: 8,
    gap: 20,
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
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    backgroundColor: "#e8c9a8",
    width: 24,
  },
  primary: {
    backgroundColor: "#6b5344",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  primaryPressed: {
    opacity: 0.92,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
