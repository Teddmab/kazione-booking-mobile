import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSupplier,
  createSupplierOrder,
  getSupplier,
  getSupplierOrders,
  getSuppliers,
} from "@/services/owner/suppliers";
import type { CreateOrderData, CreateSupplierData, SupplierFilters } from "@/types/suppliers";

export function useSuppliers(businessId: string, filters: SupplierFilters = {}) {
  return useQuery({
    queryKey: ["owner-suppliers", businessId, filters],
    queryFn: () => getSuppliers(businessId, filters),
    enabled: !!businessId,
  });
}

export function useSupplierDetail(supplierId: string | null) {
  return useQuery({
    queryKey: ["owner-supplier", supplierId],
    queryFn: () => getSupplier(supplierId!),
    enabled: !!supplierId,
  });
}

export function useSupplierOrders(businessId: string) {
  return useQuery({
    queryKey: ["owner-supplier-orders", businessId],
    queryFn: () => getSupplierOrders(businessId),
    enabled: !!businessId,
  });
}

export function useCreateSupplier(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupplierData) => createSupplier(businessId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-suppliers", businessId] });
    },
  });
}

export function useCreateSupplierOrder(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderData) => createSupplierOrder(businessId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-supplier-orders", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-suppliers", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-finance"] });
    },
  });
}
