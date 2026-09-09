import { useQuery } from "@tanstack/react-query";

import { useTenantContext } from "@/contexts/TenantContext";
import { fetchStaffReviews } from "@/services/staff/reviews";

/** Staff reviews for the current member only (parity with web StaffReviewsPage). */
export function useStaffReviews(page: number) {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const staffProfileId = tenant?.staffProfileId ?? "";

  return useQuery({
    queryKey: ["staff-reviews", businessId, staffProfileId, page],
    queryFn: () => fetchStaffReviews(businessId, staffProfileId, page, 20),
    enabled: !!businessId && !!staffProfileId,
    staleTime: 60_000,
  });
}
