import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ServiceFormValues } from "@/components/owner/ServiceFormSheet";
import {
  addServiceProduct,
  createService,
  deactivateService,
  getOwnerServices,
  getServiceProductUsage,
  removeServiceProduct,
  restoreService,
  updateService,
  type ServiceProductUsageRow,
} from "@/services/owner/services";

export interface ProductUsageInput {
  productId: string;
  quantity: number;
}

function parseMoney(value: string): number {
  return Number(value.replace(",", "."));
}

function buildServicePayload(values: ServiceFormValues) {
  return {
    name: values.name.trim(),
    duration_minutes: values.duration_minutes,
    buffer_minutes: values.buffer_minutes,
    price: parseMoney(values.price),
    deposit_amount: values.deposit_amount.trim() ? parseMoney(values.deposit_amount) : null,
    description: values.description.trim() || null,
    category_name: values.category_name.trim() || undefined,
    is_active: values.is_active,
    staff_commission_type: values.staff_commission_type,
    staff_commission_value:
      values.staff_commission_type === "none"
        ? null
        : parseMoney(values.staff_commission_value),
    image_url: values.image_url.trim() || null,
    image_url_2: values.image_url_2.trim() || null,
    image_url_3: values.image_url_3.trim() || null,
  };
}

async function syncServiceProductUsage(
  businessId: string,
  serviceId: string,
  productUsage: ProductUsageInput[],
) {
  const existing: ServiceProductUsageRow[] = await getServiceProductUsage(serviceId);
  const existingMap = new Map(existing.map((u) => [u.product_id, u]));
  const desiredMap = new Map(productUsage.map((p) => [p.productId, p]));

  for (const [productId, usage] of existingMap) {
    if (!desiredMap.has(productId)) await removeServiceProduct(usage.id);
  }
  for (const [productId, input] of desiredMap) {
    const ex = existingMap.get(productId);
    if (!ex) {
      await addServiceProduct(businessId, serviceId, productId, input.quantity);
    } else if (ex.quantity_per_service !== input.quantity) {
      await removeServiceProduct(ex.id);
      await addServiceProduct(businessId, serviceId, productId, input.quantity);
    }
  }
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
      productUsage,
      skipProductSync = false,
    }: {
      values: ServiceFormValues;
      serviceId: string | null;
      productUsage?: ProductUsageInput[];
      skipProductSync?: boolean;
    }) => {
      const payload = buildServicePayload(values);
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

      if (!skipProductSync && productUsage !== undefined) {
        await syncServiceProductUsage(businessId, saved.id, productUsage);
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

export function useSyncServiceProducts(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      serviceId,
      productUsage,
    }: {
      serviceId: string;
      productUsage: ProductUsageInput[];
    }) => {
      await syncServiceProductUsage(businessId, serviceId, productUsage);
      return serviceId;
    },
    onSuccess: (serviceId) => {
      void queryClient.invalidateQueries({ queryKey: ["owner-services", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["service-product-usage", serviceId] });
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

export function useRestoreOwnerService(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreService(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-services", businessId] });
    },
  });
}
