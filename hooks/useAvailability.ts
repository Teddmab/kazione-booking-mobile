import { useQuery } from "@tanstack/react-query";

import { getAvailability } from "@/services/booking";
import type { AvailabilityParams, AvailabilityResult } from "@/types/booking";

export function useAvailability(params: Partial<AvailabilityParams>) {
  return useQuery<AvailabilityResult>({
    queryKey: ["availability", params],
    queryFn: () => getAvailability(params as AvailabilityParams),
    enabled: !!params.business_id && !!params.service_id && !!params.date,
    staleTime: 30_000,
  });
}
