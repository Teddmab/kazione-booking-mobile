import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ServiceFormValues } from "@/components/owner/ServiceFormSheet";
import {
  createService,
  deactivateService,
  getOwnerServices,
  updateService,
} from "@/services/owner/services";

function parsePrice(price: string): number {
  return Number(price.replace(",", "."));
}

export function useOwnerServices(businessId: string) {
  return useQuery({
    queryKey: ["owner-services", businessId],
    queryFn: () => getOwnerServices(businessId),
    enabled: !!businessId,
  });
}

export function useSaveOwnerService(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      values,
      serviceId,
    }: {
      values: ServiceFormValues;
      serviceId: string | null;
    }) => {
      const payload = {
        name: values.name.trim(),
        duration_minutes: values.duration_minutes,
        price: parsePrice(values.price),
        description: values.description.trim() || null,
        category_name: values.category_name.trim() || undefined,
        is_active: values.is_active,
      };
      if (serviceId) {
        return updateService(serviceId, payload);
      }
      return createService({
        business_id: businessId,
        ...payload,
        currency_code: "EUR",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-services", businessId] });
    },
  });
}

export function useDeactivateOwnerService(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateService(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-services", businessId] });
    },
  });
}
