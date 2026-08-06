import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useTenantContext } from "@/contexts/TenantContext";
import { getClient, getClients } from "@/services/owner/clients";

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function useStaffClients(search: string) {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  return useQuery({
    queryKey: ["staff-clients", businessId, debouncedSearch],
    queryFn: () =>
      getClients(businessId, {
        limit: 200,
        page: 1,
        search: debouncedSearch || undefined,
      }),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function useStaffClientDetail(clientId: string | null) {
  return useQuery({
    queryKey: ["staff-client-detail", clientId],
    queryFn: () => getClient(clientId!),
    enabled: !!clientId,
    staleTime: 60_000,
  });
}
