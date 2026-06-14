import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ServiceFormValues } from "@/components/owner/ServiceFormSheet";
import {
  createService,
  deactivateService,
  getOwnerServices,
  restoreService,
  updateService,
  uploadAndAttachServiceImage,
} from "@/services/owner/services";

function parseMoney(value: string): number {
  return Number(value.replace(",", "."));
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
      localImageUri,
    }: {
      values: ServiceFormValues;
      serviceId: string | null;
      localImageUri?: string | null;
    }) => {
      const payload = {
        name: values.name.trim(),
        duration_minutes: values.duration_minutes,
        buffer_minutes: values.buffer_minutes,
        price: parseMoney(values.price),
        deposit_amount: values.deposit_amount.trim()
          ? parseMoney(values.deposit_amount)
          : null,
        description: values.description.trim() || null,
        category_name: values.category_name.trim() || undefined,
        is_active: values.is_active,
      };
      let saved;
      if (serviceId) {
        saved = await updateService(serviceId, payload);
      } else {
        saved = await createService({
          business_id: businessId,
          ...payload,
          currency_code: "EUR",
        });
      }
      if (localImageUri) {
        saved = await uploadAndAttachServiceImage(businessId, saved.id, localImageUri);
      }
      return saved;
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

export function useRestoreOwnerService(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreService(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-services", businessId] });
    },
  });
}
