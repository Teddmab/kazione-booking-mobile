import { useQuery } from "@tanstack/react-query";

import { getClients } from "@/services/owner/clients";
import type { ClientFilters } from "@/types/owner";

export function useOwnerClients(businessId: string, filters: ClientFilters = {}) {
  return useQuery({
    queryKey: ["owner-clients", businessId, filters],
    queryFn: () => getClients(businessId, filters),
    enabled: !!businessId,
  });
}
