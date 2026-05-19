import { useQuery } from "@tanstack/react-query";

import { getOwnerStorefront } from "@/services/owner/storefront";

export function useOwnerStorefront(businessId: string) {
  return useQuery({
    queryKey: ["owner-storefront", businessId],
    queryFn: () => getOwnerStorefront(businessId),
    enabled: !!businessId,
  });
}
