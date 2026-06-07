import type { QueryClient } from "@tanstack/react-query";

import type { ClientFilters } from "@/types/owner";

export function ownerClientsQueryKey(businessId: string, filters: ClientFilters = {}) {
  return ["owner-clients", businessId, filters] as const;
}

export function ownerClientStatsQueryKey(businessId: string) {
  return ["owner-client-stats", businessId] as const;
}

export function invalidateOwnerClientQueries(queryClient: QueryClient, businessId: string) {
  void queryClient.invalidateQueries({ queryKey: ["owner-clients", businessId] });
  void queryClient.invalidateQueries({ queryKey: ownerClientStatsQueryKey(businessId) });
  void queryClient.invalidateQueries({ queryKey: ["owner-clients-search", businessId] });
}
