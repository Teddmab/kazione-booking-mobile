import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { QueryState } from "@/components/owner/QueryState";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useToast } from "@/contexts/ToastContext";
import {
  useRegisterForTraining,
  useStaffTraining,
} from "@/hooks/useStaffTraining";
import type { StaffTrainingItem } from "@/services/staff/training";

function CourseCard({
  item,
  starting,
  onStart,
  onContinue,
  styles,
  colors,
}: {
  item: StaffTrainingItem;
  starting: boolean;
  onStart: () => void;
  onContinue: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const { t } = useTranslation();
  const total = item.sessions_total ?? 0;
  const used = item.sessions_used ?? 0;
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const done =
    item.status === "completed" || (total > 0 && used >= total);
  const notStarted = item.status === "not_started" || !item.redemption_id;
  const title =
    item.offer_title || item.course?.title || t("staffTraining.fallbackTitle");

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconBox}>
          <Ionicons name="book-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.cardMeta}>
            {done
              ? t("staffTraining.completed")
              : notStarted
                ? total > 0
                  ? t("staffTraining.sessionsCount", { count: total })
                  : t("staffTraining.selfPaced")
                : t("staffTraining.progressSessions", { used, total: total || "?" })}
          </Text>
        </View>
        {done ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        ) : null}
      </View>

      {total > 0 && !notStarted ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{t("staffTraining.progress")}</Text>
            <Text style={styles.progressLabel}>{pct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${pct}%`,
                  backgroundColor: done ? colors.success : colors.primary,
                },
              ]}
            />
          </View>
        </View>
      ) : null}

      {!done ? (
        <Pressable
          style={[styles.actionBtn, starting && styles.disabled]}
          disabled={starting}
          onPress={() => (item.redemption_id ? onContinue() : onStart())}>
          {starting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="play-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionText}>
                {notStarted ? t("staffTraining.start") : t("staffTraining.continue")}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

export default function StaffTrainingScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const toast = useToast();
  const { data = [], isLoading, isError, error, refetch, isRefetching } =
    useStaffTraining();
  const register = useRegisterForTraining();
  const [startingId, setStartingId] = useState<string | null>(null);

  const completed = data.filter(
    (c) =>
      c.status === "completed" ||
      ((c.sessions_total ?? 0) > 0 && c.sessions_used >= (c.sessions_total ?? 0)),
  );
  const completedIds = new Set(completed.map((c) => c.offer_id));
  const available = data.filter((c) => !c.redemption_id && !completedIds.has(c.offer_id));
  const inProgress = data.filter(
    (c) => Boolean(c.redemption_id) && !completedIds.has(c.offer_id),
  );

  async function handleStart(offerId: string) {
    setStartingId(offerId);
    try {
      const result = await register.mutateAsync(offerId);
      router.push(`/(app)/staff/(tabs)/training/${result.redemption_id}` as Href);
    } catch (err) {
      toast.error(
        t("staffTraining.title"),
        err instanceof Error ? err.message : t("staffTraining.startFailed"),
      );
      void refetch();
    } finally {
      setStartingId(null);
    }
  }

  function handleContinue(redemptionId: string) {
    router.push(`/(app)/staff/(tabs)/training/${redemptionId}` as Href);
  }

  return (
    <View style={styles.screen}>
      <StaffAppBar
        title={t("staffTraining.title")}
        subtitle={t("staffTraining.subtitle")}
        displayTitle
      />
      <QueryState
        loading={isLoading && data.length === 0}
        error={isError ? (error as Error) : null}
        empty={false}
        onRetry={() => void refetch()}>
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={[
            styles.content,
            data.length === 0 && styles.emptyContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }>
          {data.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="school-outline" size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>{t("staffTraining.emptyTitle")}</Text>
              <Text style={styles.emptyHint}>{t("staffTraining.emptyHint")}</Text>
            </View>
          ) : null}

          {inProgress.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("staffTraining.inProgress")}</Text>
              {inProgress.map((item) => (
                <CourseCard
                  key={item.offer_id}
                  item={item}
                  starting={startingId === item.offer_id}
                  onStart={() => void handleStart(item.offer_id)}
                  onContinue={() => handleContinue(item.redemption_id!)}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          ) : null}

          {available.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("staffTraining.available")}</Text>
              {available.map((item) => (
                <CourseCard
                  key={item.offer_id}
                  item={item}
                  starting={startingId === item.offer_id}
                  onStart={() => void handleStart(item.offer_id)}
                  onContinue={() =>
                    item.redemption_id
                      ? handleContinue(item.redemption_id)
                      : void handleStart(item.offer_id)
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          ) : null}

          {completed.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("staffTraining.completedSection")}</Text>
              {completed.map((item) => (
                <CourseCard
                  key={item.offer_id}
                  item={item}
                  starting={false}
                  onStart={() => undefined}
                  onContinue={() =>
                    item.redemption_id
                      ? handleContinue(item.redemption_id)
                      : undefined
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </QueryState>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40, gap: 18 },
    emptyContent: { flexGrow: 1, justifyContent: "center" },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 48,
      paddingHorizontal: 28,
      gap: 8,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primarySurface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      fontFamily: ownerFonts.bold,
    },
    emptyHint: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 18,
      fontFamily: ownerFonts.regular,
    },
    section: { gap: 10 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textMuted,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      fontFamily: ownerFonts.bold,
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      gap: 12,
    },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primarySurface,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    cardMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    progressWrap: { gap: 4 },
    progressLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    progressLabel: {
      fontSize: 10,
      color: colors.textDim,
      fontFamily: ownerFonts.medium,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.bg,
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 3 },
    actionBtn: {
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    actionText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    disabled: { opacity: 0.6 },
  });
}
