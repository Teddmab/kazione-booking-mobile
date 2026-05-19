import { useQuery } from "@tanstack/react-query";

import { getStaffList } from "@/services/owner/staff";

export function useOwnerStaff(businessId: string) {
  return useQuery({
    queryKey: ["owner-staff", businessId],
    queryFn: () => getStaffList(businessId),
    enabled: !!businessId,
  });
}
