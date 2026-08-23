import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useTenantContext } from "@/contexts/TenantContext";
import { getClient, getClients, patchClient } from "@/services/owner/clients";
import { fetchClientEntitlements } from "@/services/staff/entitlements";

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

export function useClientEntitlements(clientId: string | null) {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  return useQuery({
    queryKey: ["client-entitlements", businessId, clientId],
    queryFn: () => fetchClientEntitlements(businessId, clientId!),
    enabled: !!clientId && !!businessId,
    staleTime: 30_000,
  });
}

export function useUpdateStaffClientNotes() {
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, notes }: { clientId: string; notes: string }) =>
      patchClient(clientId, { business_id: businessId, notes }),
    onSuccess: (data, vars) => {
      qc.setQueryData(["staff-client-detail", vars.clientId], data);
      void qc.invalidateQueries({ queryKey: ["staff-clients", businessId] });
    },
  });
}
