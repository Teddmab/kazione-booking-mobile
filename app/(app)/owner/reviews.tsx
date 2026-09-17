import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { QueryState } from "@/components/owner/QueryState";
import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import {
  useModerateOwnerReview,
  useOwnerReviews,
  useReplyToOwnerReview,
} from "@/hooks/useOwnerReviews";
import type { OwnerReviewRow } from "@/services/owner/reviews";
import { buildReviewInviteUrl } from "@/services/staff/reviews";

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rating ? "star" : "star-outline"}
          size={size}
          color={n <= rating ? "#FBBF24" : ownerColors.border}
        />
      ))}
    </View>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function OwnerReviewsScreen() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [page, setPage] = useState(1);
  const reviewsQ = useOwnerReviews(businessId, page);
  const replyMut = useReplyToOwnerReview(businessId);
  const moderateMut = useModerateOwnerReview(businessId);

  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [moderation, setModeration] = useState<{ id: string; hide: boolean } | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const reviews = reviewsQ.data?.reviews ?? [];
  const total = reviewsQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));
  const avg =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  function openModerate(review: OwnerReviewRow, hide: boolean) {
    setModeration({ id: review.id, hide });
    setModerationReason("");
  }

  async function copyLink(token: string, id: string) {
    await Clipboard.setStringAsync(buildReviewInviteUrl(token));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <OwnerStackShell title={t("owner.reviews")} subtitle={t("owner.reviewsSub")}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={reviewsQ.isRefetching}
            onRefresh={() => void reviewsQ.refetch()}
          />
        }>
        {reviews.length > 0 ? (
          <View style={styles.summary}>
            <View>
              <Text style={styles.avg}>{avg ? avg.toFixed(1) : "—"}</Text>
              <Stars rating={Math.round(avg)} size={16} />
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.avg}>{total}</Text>
              <Text style={styles.summaryLbl}>{t("owner.reviewsCount")}</Text>
            </View>
          </View>
        ) : null}

        <QueryState
          loading={reviewsQ.isLoading}
          error={reviewsQ.isError ? (reviewsQ.error as Error) : null}
          empty={!reviewsQ.isLoading && reviews.length === 0}
          emptyMessage={t("owner.reviewsEmpty")}
          onRetry={() => void reviewsQ.refetch()}>
          {reviews.map((review) => {
            const name =
              review.reviewer_name ??
              (review.client
                ? `${review.client.first_name} ${review.client.last_name}`.trim()
                : t("owner.reviewAnonymous"));
            const isPending = !!review.review_token && !review.token_used_at;
            const isHidden = !review.is_public && !!review.moderated_at;
            return (
              <View key={review.id} style={styles.card}>
                <View style={styles.cardTop}>
                  {review.client?.avatar_url ? (
                    <Image source={{ uri: review.client.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarText}>{initials(name)}</Text>
                    </View>
                  )}
                  <View style={styles.cardBody}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {name}
                      </Text>
                      {isPending ? (
                        <View style={styles.badgeMuted}>
                          <Text style={styles.badgeMutedText}>{t("owner.reviewPending")}</Text>
                        </View>
                      ) : null}
                      {isHidden ? (
                        <View style={styles.badgeDanger}>
                          <Text style={styles.badgeDangerText}>{t("owner.reviewHidden")}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.date}>
                        {new Date(review.created_at).toLocaleDateString(i18n.language)}
                      </Text>
                    </View>
                    <View style={{ marginTop: 4 }}>
                      <Stars rating={review.rating} size={13} />
                    </View>
                    {review.comment ? (
                      <Text style={styles.comment}>{review.comment}</Text>
                    ) : null}
                    {review.owner_reply ? (
                      <View style={styles.replyBox}>
                        <Text style={styles.replyLabel}>{t("owner.reviewSalonReply")}</Text>
                        <Text style={styles.replyText}>{review.owner_reply}</Text>
                      </View>
                    ) : review.token_used_at ? (
                      <Pressable
                        onPress={() => {
                          setReplyId(review.id);
                          setReplyText("");
                        }}
                        style={styles.replyBtn}>
                        <Ionicons name="chatbubble-outline" size={12} color={ownerColors.primary} />
                        <Text style={styles.link}>{t("owner.reviewReply")}</Text>
                      </Pressable>
                    ) : null}
                    {isPending && review.review_token ? (
                      <Pressable
                        style={styles.copyRow}
                        onPress={() => void copyLink(review.review_token!, review.id)}>
                        <Text style={styles.copyUrl} numberOfLines={1}>
                          {buildReviewInviteUrl(review.review_token)}
                        </Text>
                        <Text style={styles.link}>
                          {copiedId === review.id ? t("owner.reviewCopied") : t("owner.reviewCopyLink")}
                        </Text>
                      </Pressable>
                    ) : null}
                    {!isPending ? (
                      <Pressable
                        onPress={() => openModerate(review, !isHidden)}
                        style={styles.modBtn}>
                        <Ionicons
                          name={isHidden ? "eye-outline" : "eye-off-outline"}
                          size={12}
                          color={ownerColors.textMuted}
                        />
                        <Text style={styles.linkMuted}>
                          {isHidden ? t("owner.reviewRestore") : t("owner.reviewHide")}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </QueryState>

        {totalPages > 1 ? (
          <View style={styles.pager}>
            <Pressable
              disabled={page === 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              style={[styles.pageBtn, page === 1 && { opacity: 0.4 }]}>
              <Ionicons name="chevron-back" size={16} color={ownerColors.text} />
            </Pressable>
            <Text style={styles.pageLbl}>
              {page} / {totalPages}
            </Text>
            <Pressable
              disabled={page === totalPages}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={[styles.pageBtn, page === totalPages && { opacity: 0.4 }]}>
              <Ionicons name="chevron-forward" size={16} color={ownerColors.text} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={!!replyId}
        transparent
        animationType="fade"
        onRequestClose={() => setReplyId(null)}>
        <Pressable style={styles.backdrop} onPress={() => setReplyId(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t("owner.reviewReply")}</Text>
          <TextInput
            style={styles.input}
            multiline
            value={replyText}
            onChangeText={setReplyText}
            placeholder={t("owner.reviewReplyPh")}
            placeholderTextColor={ownerColors.textDim}
          />
          <Pressable
            style={[styles.saveBtn, !replyText.trim() && { opacity: 0.5 }]}
            disabled={!replyText.trim() || replyMut.isPending}
            onPress={() => {
              if (!replyId) return;
              replyMut.mutate(
                { reviewId: replyId, reply: replyText.trim() },
                {
                  onSuccess: () => setReplyId(null),
                  onError: (err: Error) => toast.error(t("owner.reviews"), err.message),
                },
              );
            }}>
            <Text style={styles.saveText}>{t("common.save")}</Text>
          </Pressable>
        </View>
      </Modal>
      <Modal
        visible={!!moderation}
        transparent
        animationType="fade"
        onRequestClose={() => setModeration(null)}>
        <Pressable style={styles.backdrop} onPress={() => setModeration(null)} />
        <View style={styles.sheet}>
          <Text style={[styles.sheetTitle, moderation?.hide && { color: ownerColors.danger }]}>
            {moderation?.hide ? t("owner.reviewHide") : t("owner.reviewRestore")}
          </Text>
          <Text style={styles.modHint}>
            {moderation?.hide ? t("owner.reviewHideReason") : t("owner.reviewRestoreReason")}
          </Text>
          <TextInput
            style={styles.input}
            multiline
            value={moderationReason}
            onChangeText={setModerationReason}
            placeholder={t("owner.reviewReasonPh")}
            placeholderTextColor={ownerColors.textDim}
          />
          <Pressable
            style={[
              styles.saveBtn,
              moderation?.hide && { backgroundColor: ownerColors.danger },
              !moderationReason.trim() && { opacity: 0.5 },
            ]}
            disabled={!moderationReason.trim() || moderateMut.isPending}
            onPress={() => {
              if (!moderation) return;
              moderateMut.mutate(
                {
                  reviewId: moderation.id,
                  isPublic: !moderation.hide,
                  reason: moderationReason.trim(),
                },
                {
                  onSuccess: () => setModeration(null),
                  onError: (err: Error) => toast.error(t("owner.reviews"), err.message),
                },
              );
            }}>
            <Text style={styles.saveText}>
              {moderation?.hide ? t("owner.reviewHide") : t("owner.reviewRestore")}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </OwnerStackShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 14,
  },
  avg: { fontFamily: ownerFonts.bold, fontSize: 28, color: ownerColors.text },
  summaryLbl: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
  divider: { width: 1, height: 40, backgroundColor: ownerColors.border },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginTop: 2 },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ownerColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarText: { fontSize: 11, fontFamily: ownerFonts.bold, color: ownerColors.primary },
  cardBody: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  name: { fontFamily: ownerFonts.semiBold, fontSize: 14, color: ownerColors.text, flexShrink: 1 },
  date: { marginLeft: "auto", fontSize: 11, color: ownerColors.textDim },
  badgeMuted: {
    backgroundColor: ownerColors.primarySurface,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeMutedText: { fontSize: 10, color: ownerColors.textMuted },
  badgeDanger: {
    backgroundColor: ownerColors.dangerMuted,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeDangerText: { fontSize: 10, color: ownerColors.danger },
  comment: { fontSize: 13, color: ownerColors.textMuted, marginTop: 8, lineHeight: 20 },
  replyBox: {
    marginTop: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(232, 78, 38, 0.3)",
  },
  replyLabel: { fontSize: 11, color: ownerColors.primary, fontFamily: ownerFonts.medium, marginBottom: 4 },
  replyText: { fontSize: 13, color: ownerColors.textMuted },
  replyBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  copyRow: {
    marginTop: 10,
    backgroundColor: ownerColors.primarySurface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copyUrl: { flex: 1, fontSize: 11, color: ownerColors.textMuted, fontFamily: ownerFonts.regular },
  modBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  link: { color: ownerColors.primary, fontFamily: ownerFonts.semiBold, fontSize: 12 },
  linkMuted: { color: ownerColors.textMuted, fontFamily: ownerFonts.medium, fontSize: 12 },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ownerColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pageLbl: { fontSize: 13, color: ownerColors.textMuted },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
  },
  sheetTitle: { fontSize: 18, fontFamily: ownerFonts.bold, color: ownerColors.text },
  modHint: { fontSize: 13, color: ownerColors.textMuted },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 12,
    color: ownerColors.text,
    textAlignVertical: "top",
  },
  saveBtn: {
    backgroundColor: ownerColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontFamily: ownerFonts.semiBold },
});
