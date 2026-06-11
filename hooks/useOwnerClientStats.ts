import { useQuery } from "@tanstack/react-query";

import { ownerClientStatsQueryKey } from "@/lib/ownerClientQueries";
import { getClientStats } from "@/services/owner/clients";
import type { ClientStats } from "@/types/owner";

const EMPTY_STATS: ClientStats = {
  total: 0,
  new: 0,
  active: 0,
  vip: 0,
  at_risk: 0,
  inactive: 0,
};

export function useOwnerClientStats(businessId: string) {
  return useQuery<ClientStats>({
    queryKey: ownerClientStatsQueryKey(businessId),
    queryFn: () => getClientStats(businessId),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

export function ownerClientStatsOrEmpty(stats: ClientStats | undefined): ClientStats {
  return stats ?? EMPTY_STATS;
}
