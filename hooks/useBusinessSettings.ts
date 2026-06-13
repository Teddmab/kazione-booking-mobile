import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getBusinessSettings,
  patchBusinessSettings,
} from "@/services/owner/businessSettings";
import type { UpdateBusinessSettingsInput } from "@/types/owner";

const QUERY_KEY = "owner-business-settings";

export function useBusinessSettings(businessId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, businessId],
    queryFn: () => getBusinessSettings(businessId),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function useUpdateBusinessSettings(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Omit<UpdateBusinessSettingsInput, "business_id">) =>
      patchBusinessSettings({ business_id: businessId, ...patch }),
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEY, businessId], data);
    },
  });
}
