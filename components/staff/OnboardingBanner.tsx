import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";

interface Props {
  hasSchedule: boolean;
  hasAcceptedServices: boolean;
  pendingOfferCount: number;
}

export function OnboardingBanner({
  hasSchedule,
  hasAcceptedServices,
  pendingOfferCount,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const allSetup = hasSchedule && hasAcceptedServices;
  const hasPendingOffers = pendingOfferCount > 0;

  if (allSetup && !hasPendingOffers) return null;

  const doneCount = [hasSchedule, hasAcceptedServices].filter(Boolean).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("staffOnboarding.title")}</Text>
        <Text style={styles.counter}>{doneCount} / 2</Text>
      </View>

      <View style={styles.step}>
        {hasSchedule ? (
          <>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.doneLabel}>{t("staffOnboarding.scheduleDone")}</Text>
          </>
        ) : (
          <>
            <View style={styles.circle} />
            <Pressable
              style={styles.cta}
              onPress={() => router.push("/(app)/staff/(tabs)/profile" as Href)}>
              <Ionicons name="calendar-outline" size={14} color={colors.text} />
              <Text style={styles.ctaText}>{t("staffOnboarding.scheduleCta")}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.step}>
        {hasAcceptedServices ? (
          <>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.doneLabel}>{t("staffOnboarding.servicesDone")}</Text>
          </>
        ) : (
          <>
            <View style={styles.circle} />
            <Pressable
              style={styles.cta}
              onPress={() =>
                router.push("/(app)/staff/(tabs)/services" as Href)
              }>
              <Ionicons name="cut-outline" size={14} color={colors.text} />
              <Text style={styles.ctaText}>{t("staffOnboarding.servicesCta")}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
            </Pressable>
          </>
        )}
      </View>

      {hasPendingOffers ? (
        <View style={styles.step}>
          <Ionicons name="notifications-outline" size={18} color={colors.primary} />
          <Pressable
            style={[styles.cta, styles.ctaPrimary]}
            onPress={() =>
              router.push("/(app)/staff/(tabs)/services" as Href)
            }>
            <Text style={[styles.ctaText, styles.ctaPrimaryText]}>
              {t("staffOnboarding.pendingOffers", { count: pendingOfferCount })}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    title: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    counter: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    step: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    circle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.border,
    },
    doneLabel: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    cta: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.bg,
    },
    ctaPrimary: {
      borderColor: colors.primary + "66",
    },
    ctaText: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
      fontFamily: ownerFonts.medium,
    },
    ctaPrimaryText: {
      color: colors.primary,
    },
  });
}
