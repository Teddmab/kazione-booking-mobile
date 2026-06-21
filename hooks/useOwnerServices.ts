import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ServiceFormValues } from "@/components/owner/ServiceFormSheet";
import {
  createService,
  deactivateService,
  getOwnerServices,
  getServiceProductUsage,
  addServiceProduct,
  removeServiceProduct,
  updateService,
  uploadAndAttachServiceImage,
  type ServiceProductUsageRow,
} from "@/services/owner/services";

export interface ProductUsageInput {
  productId: string;
  quantity: number;
}

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
      localImageUri,
      productUsage,
    }: {
      values: ServiceFormValues;
      serviceId: string | null;
      localImageUri?: string | null;
      productUsage?: ProductUsageInput[];
    }) => {
      const payload = {
        name: values.name.trim(),
        duration_minutes: values.duration_minutes,
        price: parsePrice(values.price),
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

      // Sync product usage links
      if (productUsage !== undefined) {
        const existing: ServiceProductUsageRow[] = await getServiceProductUsage(saved.id);
        const existingMap = new Map(existing.map((u) => [u.product_id, u]));
        const desiredMap = new Map(productUsage.map((p) => [p.productId, p]));

        for (const [productId, usage] of existingMap) {
          if (!desiredMap.has(productId)) await removeServiceProduct(usage.id);
        }
        for (const [productId, input] of desiredMap) {
          const ex = existingMap.get(productId);
          if (!ex) {
            await addServiceProduct(businessId, saved.id, productId, input.quantity);
          } else if (ex.quantity_per_service !== input.quantity) {
            await removeServiceProduct(ex.id);
            await addServiceProduct(businessId, saved.id, productId, input.quantity);
          }
        }
      }

      return saved;
    },
    onSuccess: (_saved, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["owner-services", businessId] });
      if (vars.serviceId) {
        void queryClient.invalidateQueries({ queryKey: ["service-product-usage", vars.serviceId] });
      }
    },
  });
}

export function useServiceProductUsage(serviceId: string | null) {
  return useQuery<ServiceProductUsageRow[]>({
    queryKey: ["service-product-usage", serviceId],
    queryFn: () => getServiceProductUsage(serviceId!),
    enabled: !!serviceId,
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
