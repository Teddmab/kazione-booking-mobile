import { useQuery } from "@tanstack/react-query";

import { useTenantContext } from "@/contexts/TenantContext";
import { fetchStaffSelf } from "@/services/staff/profile";

export function useStaffSelf() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useQuery({
    queryKey: ["staff-self", businessId],
    queryFn: () => fetchStaffSelf(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
}
