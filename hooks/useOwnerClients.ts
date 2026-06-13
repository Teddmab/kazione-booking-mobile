import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createClient,
  getClient,
  getClients,
  patchClient,
} from "@/services/owner/clients";
import type { ClientFilters, CreateClientInput, UpdateClientInput } from "@/types/owner";

export function useOwnerClients(businessId: string, filters: ClientFilters = {}) {
  return useQuery({
    queryKey: ["owner-clients", businessId, filters],
    queryFn: () => getClients(businessId, filters),
    enabled: !!businessId,
  });
}

export function useOwnerClientDetail(clientId: string | null) {
  return useQuery({
    queryKey: ["owner-client-detail", clientId],
    queryFn: () => getClient(clientId!),
    enabled: !!clientId,
  });
}

export function useCreateOwnerClient(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateClientInput, "business_id">) =>
      createClient({ business_id: businessId, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-clients", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-client-stats", businessId] });
    },
  });
}

export function useUpdateOwnerClient(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: UpdateClientInput }) =>
      patchClient(clientId, data),
    onSuccess: (_res, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["owner-clients", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-client-detail", vars.clientId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-client-stats", businessId] });
    },
  });
}
