import { useQuery } from "@tanstack/react-query";

import { useTenantContext } from "@/contexts/TenantContext";
import { fetchBusinessReviews } from "@/services/staff/reviews";

export function useStaffReviews(page: number) {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useQuery({
    queryKey: ["staff-reviews", businessId, page],
    queryFn: () => fetchBusinessReviews(businessId, page, 20),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}
