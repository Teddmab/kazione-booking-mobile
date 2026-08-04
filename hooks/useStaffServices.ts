import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTenantContext } from "@/contexts/TenantContext";
import {
  fetchStaffServices,
  respondToServiceOffer,
} from "@/services/staff/services";

export function useStaffServices() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useQuery({
    queryKey: ["staff-services", businessId],
    queryFn: () => fetchStaffServices(businessId),
    enabled: !!businessId,
    staleTime: 2 * 60_000,
  });
}

export function useRespondToServiceOffer() {
  const qc = useQueryClient();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useMutation({
    mutationFn: ({
      serviceId,
      response,
    }: {
      serviceId: string;
      response: "accepted" | "declined";
    }) => respondToServiceOffer(businessId, serviceId, response),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff-services", businessId] });
    },
  });
}
