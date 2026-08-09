import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { QueryState } from "@/components/owner/QueryState";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useStaffReviews } from "@/hooks/useStaffReviews";
import {
  buildReviewInviteUrl,
  type StaffReviewRow,
} from "@/services/staff/reviews";

type ReviewStyles = ReturnType<typeof makeStyles>;

function Stars({
  rating,
  size = 13,
  styles,
  colors,
}: {
  rating: number;
  size?: number;
  styles: ReviewStyles;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text
          key={n}
          style={{
            fontSize: size,
            color: n <= rating ? "#F59E0B" : colors.border,
          }}>
          ★
        </Text>
      ))}
    </View>
  );
}

function ReviewCard({
  review,
  onCopy,
  styles,
  colors,
}: {
  review: StaffReviewRow;
  onCopy: (url: string) => void;
  styles: ReviewStyles;
  colors: ThemeColors;
}) {
  const displayName =
    review.reviewer_name ??
    (review.client
      ? `${review.client.first_name} ${review.client.last_name}`.trim()
      : "Anonyme");
  const initials = displayName.slice(0, 2).toUpperCase();
  const inviteUrl =
    review.review_token && !review.token_used_at
      ? buildReviewInviteUrl(review.review_token)
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {review.client?.avatar_url ? (
          <Image
            source={{ uri: review.client.avatar_url }}
            style={styles.avatarImg}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            {!review.is_public ? (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>En attente</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.date}>
            {new Date(review.created_at).toLocaleDateString("fr-FR")}
          </Text>
        </View>
      </View>

      <Stars rating={review.rating} styles={styles} colors={colors} />

      {review.comment ? (
        <Text style={styles.comment}>{review.comment}</Text>
      ) : null}

      {review.owner_reply ? (
        <View style={styles.replyBox}>
          <Text style={styles.replyLabel}>Réponse du salon</Text>
          <Text style={styles.replyText}>{review.owner_reply}</Text>
        </View>
      ) : null}

      {inviteUrl ? (
        <View style={styles.inviteBox}>
          <Text style={styles.inviteHint} numberOfLines={1}>
            En attente de l'avis client
          </Text>
          <Pressable style={styles.copyBtn} onPress={() => onCopy(inviteUrl)}>
            <Text style={styles.copyText}>Copier le lien</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function StaffReviewsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useStaffReviews(page);

  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const avg = useMemo(
    () =>
      reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0,
    [reviews],
  );

  async function copyLink(url: string) {
    try {
      await Clipboard.setStringAsync(url);
      toast.success("Copié", "Lien d'avis copié.");
    } catch (err) {
      toast.error(
        "Copie",
        err instanceof Error ? err.message : "Impossible de copier",
      );
    }
  }

  return (
    <View style={styles.screen}>
      <StaffAppBar
        title="Avis"
        subtitle="Retours clients sur le salon"
        displayTitle
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }>
        {reviews.length > 0 || total > 0 ? (
          <View style={styles.summary}>
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryValue}>
                {avg > 0 ? avg.toFixed(1) : "—"}
              </Text>
              <Stars
                rating={Math.round(avg)}
                size={16}
                styles={styles}
                colors={colors}
              />
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryValue}>{total}</Text>
              <Text style={styles.summaryLabel}>
                {total === 1 ? "avis" : "avis"}
              </Text>
            </View>
          </View>
        ) : null}

        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          empty={!isLoading && reviews.length === 0}
          emptyMessage="Aucun avis pour le moment."
          onRetry={() => void refetch()}>
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              onCopy={(url) => void copyLink(url)}
              styles={styles}
              colors={colors}
            />
          ))}
        </QueryState>

        {totalPages > 1 ? (
          <View style={styles.pager}>
            <Pressable
              style={[styles.pageBtn, page <= 1 && styles.disabled]}
              disabled={page <= 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}>
              <Text style={styles.pageBtnText}>Précédent</Text>
            </Pressable>
            <Text style={styles.pageLabel}>
              {page} / {totalPages}
            </Text>
            <Pressable
              style={[styles.pageBtn, page >= totalPages && styles.disabled]}
              disabled={page >= totalPages}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <Text style={styles.pageBtnText}>Suivant</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    summary: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    },
    summaryBlock: { flex: 1, alignItems: "center" },
    summaryValue: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
      fontFamily: ownerFonts.medium,
    },
    summaryDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
    stars: { flexDirection: "row", gap: 2, marginTop: 4 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 10,
    },
    cardHeader: { flexDirection: "row", gap: 10, marginBottom: 8 },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primarySurface,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImg: { width: 36, height: 36, borderRadius: 18 },
    avatarText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: ownerFonts.bold,
    },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    name: {
      flexShrink: 1,
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    pendingBadge: {
      borderRadius: 999,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    pendingText: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    date: {
      fontSize: 11,
      color: colors.textDim,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    comment: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textMuted,
      marginTop: 8,
      fontFamily: ownerFonts.regular,
    },
    replyBox: {
      marginTop: 10,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: colors.primary + "55",
    },
    replyLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.primary,
      marginBottom: 2,
      fontFamily: ownerFonts.semiBold,
    },
    replyText: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    inviteBox: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.bg,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    inviteHint: {
      flex: 1,
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    copyBtn: {
      borderRadius: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    copyText: {
      fontSize: 12,
      color: "#fff",
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    pager: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
    },
    pageBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.card,
    },
    pageBtnText: {
      fontSize: 13,
      color: colors.text,
      fontFamily: ownerFonts.medium,
    },
    pageLabel: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.medium,
    },
    disabled: { opacity: 0.45 },
  });
}
