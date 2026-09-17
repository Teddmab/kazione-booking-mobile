import { api } from "@/lib/api";
import type { StaffReviewRow } from "@/services/staff/reviews";

export type OwnerReviewRow = StaffReviewRow & {
  moderated_at?: string | null;
  moderation_reason?: string | null;
};

export interface PaginatedOwnerReviews {
  reviews: OwnerReviewRow[];
  total: number;
}

export async function getOwnerReviews(
  businessId: string,
  page = 1,
  limit = 20,
): Promise<PaginatedOwnerReviews> {
  const params = new URLSearchParams({
    business_id: businessId,
    page: String(page),
    limit: String(limit),
  });
  return api.get<PaginatedOwnerReviews>(`/reviews?${params.toString()}`);
}

export async function replyToReview(
  reviewId: string,
  reply: string,
): Promise<OwnerReviewRow> {
  return api.patch<OwnerReviewRow>(
    `/reviews?id=${encodeURIComponent(reviewId)}`,
    { reply },
  );
}

export async function moderateReview(
  reviewId: string,
  isPublic: boolean,
  reason: string,
): Promise<OwnerReviewRow> {
  return api.patch<OwnerReviewRow>(
    `/reviews?id=${encodeURIComponent(reviewId)}&action=moderate`,
    { is_public: isPublic, reason },
  );
}
