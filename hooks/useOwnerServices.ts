import { useQuery } from "@tanstack/react-query";

import { getOwnerServices } from "@/services/owner/services";

export function useOwnerServices(businessId: string) {
  return useQuery({
    queryKey: ["owner-services", businessId],
    queryFn: () => getOwnerServices(businessId),
    enabled: !!businessId,
  });
}
