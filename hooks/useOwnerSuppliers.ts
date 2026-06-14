import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSupplier,
  createSupplierOrder,
  deactivateSupplier,
  getSupplier,
  getSupplierOrders,
  getSuppliers,
  scanInvoice,
  updateOrderStatus,
  updateSupplier,
} from "@/services/owner/suppliers";
import type {
  CreateOrderData,
  CreateSupplierData,
  SupplierFilters,
  SupplierOrderFilters,
  SupplierOrderStatus,
} from "@/types/suppliers";

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

export function useSupplierOrders(businessId: string, filters: SupplierOrderFilters = {}) {
  return useQuery({
    queryKey: ["owner-supplier-orders", businessId, filters],
    queryFn: () => getSupplierOrders(businessId, filters),
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

export function useUpdateSupplier(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSupplierData> }) =>
      updateSupplier(id, data),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["owner-suppliers", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-supplier", vars.id] });
    },
  });
}

export function useDeactivateSupplier(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateSupplier(id),
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
      void queryClient.invalidateQueries({ queryKey: ["owner-products", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-finance"] });
    },
  });
}

export function useUpdateOrderStatus(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: SupplierOrderStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-supplier-orders", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-suppliers", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-products", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-finance"] });
    },
  });
}

export function useScanInvoice(businessId: string) {
  return useMutation({
    mutationFn: ({
      imageUrl,
      imageBase64,
      mediaType,
    }: {
      imageUrl?: string;
      imageBase64?: string;
      mediaType?: string;
    }) => scanInvoice(businessId, imageUrl, imageBase64, mediaType),
  });
}
