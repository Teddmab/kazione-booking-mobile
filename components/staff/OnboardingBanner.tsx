import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";

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
  const router = useRouter();
  const allSetup = hasSchedule && hasAcceptedServices;
  const hasPendingOffers = pendingOfferCount > 0;

  if (allSetup && !hasPendingOffers) return null;

  const doneCount = [hasSchedule, hasAcceptedServices].filter(Boolean).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Getting started</Text>
        <Text style={styles.counter}>{doneCount} / 2</Text>
      </View>

      <View style={styles.step}>
        {hasSchedule ? (
          <>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.doneLabel}>Horaires définis</Text>
          </>
        ) : (
          <>
            <View style={styles.circle} />
            <Pressable
              style={styles.cta}
              onPress={() => router.push("/(app)/staff/profile" as Href)}>
              <Ionicons name="calendar-outline" size={14} color={ownerColors.text} />
              <Text style={styles.ctaText}>Définir vos horaires</Text>
              <Ionicons name="arrow-forward" size={14} color={ownerColors.textMuted} />
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.step}>
        {hasAcceptedServices ? (
          <>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.doneLabel}>Services acceptés</Text>
          </>
        ) : (
          <>
            <View style={styles.circle} />
            <Pressable
              style={styles.cta}
              onPress={() =>
                router.push("/(app)/staff/(tabs)/services" as Href)
              }>
              <Ionicons name="cut-outline" size={14} color={ownerColors.text} />
              <Text style={styles.ctaText}>Accepter vos services</Text>
              <Ionicons name="arrow-forward" size={14} color={ownerColors.textMuted} />
            </Pressable>
          </>
        )}
      </View>

      {hasPendingOffers ? (
        <View style={styles.step}>
          <Ionicons name="notifications-outline" size={18} color={ownerColors.primary} />
          <Pressable
            style={[styles.cta, styles.ctaPrimary]}
            onPress={() =>
              router.push("/(app)/staff/(tabs)/services" as Href)
            }>
            <Text style={[styles.ctaText, styles.ctaPrimaryText]}>
              {pendingOfferCount} offre
              {pendingOfferCount > 1 ? "s" : ""} de service en attente
            </Text>
            <Ionicons name="arrow-forward" size={14} color={ownerColors.primary} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...ownerStyles.card,
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
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  counter: {
    fontSize: 12,
    color: ownerColors.textMuted,
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
    borderColor: ownerColors.border,
  },
  doneLabel: {
    fontSize: 13,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.regular,
  },
  cta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: ownerColors.bg,
  },
  ctaPrimary: {
    borderColor: ownerColors.primary + "66",
  },
  ctaText: {
    flex: 1,
    fontSize: 12,
    color: ownerColors.text,
    fontFamily: ownerFonts.medium,
  },
  ctaPrimaryText: {
    color: ownerColors.primary,
  },
});
