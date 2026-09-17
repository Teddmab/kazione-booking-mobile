import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getOwnerReviews,
  moderateReview,
  replyToReview,
} from "@/services/owner/reviews";

export function useOwnerReviews(businessId: string, page = 1) {
  return useQuery({
    queryKey: ["owner-reviews", businessId, page],
    queryFn: () => getOwnerReviews(businessId, page, 20),
    enabled: !!businessId,
  });
}

export function useReplyToOwnerReview(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      replyToReview(reviewId, reply),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-reviews", businessId] });
    },
  });
}

export function useModerateOwnerReview(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      isPublic,
      reason,
    }: {
      reviewId: string;
      isPublic: boolean;
      reason: string;
    }) => moderateReview(reviewId, isPublic, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-reviews", businessId] });
    },
  });
}
