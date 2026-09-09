import { api } from "@/lib/api";

export interface StaffReviewRow {
  id: string;
  business_id: string;
  client_id: string | null;
  appointment_id: string | null;
  rating: number;
  comment: string | null;
  reviewer_name: string | null;
  is_public: boolean;
  owner_reply: string | null;
  replied_at: string | null;
  review_token: string | null;
  token_used_at: string | null;
  created_at: string;
  client: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

export interface PaginatedStaffReviews {
  reviews: StaffReviewRow[];
  total: number;
}

export async function fetchStaffReviews(
  businessId: string,
  staffProfileId: string,
  page = 1,
  limit = 20,
): Promise<PaginatedStaffReviews> {
  const params = new URLSearchParams({
    business_id: businessId,
    staff_profile_id: staffProfileId,
    page: String(page),
    limit: String(limit),
  });
  return api.get<PaginatedStaffReviews>(`/reviews?${params.toString()}`);
}

export function buildReviewInviteUrl(token: string): string {
  const base = (
    process.env.EXPO_PUBLIC_WEB_APP_URL ?? "https://kazione.app"
  ).replace(/\/$/, "");
  return `${base}/review?token=${encodeURIComponent(token)}`;
}
