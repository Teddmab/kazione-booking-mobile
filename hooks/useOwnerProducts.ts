import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  adjustStock,
  createProduct,
  deactivateProduct,
  getProducts,
} from "@/services/owner/products";
import type { AdjustStockData, CreateProductData } from "@/types/products";

export function useOwnerProducts(businessId: string) {
  return useQuery({
    queryKey: ["owner-products", businessId],
    queryFn: () => getProducts(businessId),
    enabled: !!businessId,
  });
}

export function useCreateProduct(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductData) => createProduct(businessId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-products", businessId] });
    },
  });
}

export function useAdjustStock(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: AdjustStockData }) =>
      adjustStock(productId, businessId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-products", businessId] });
    },
  });
}

export function useDeactivateProduct(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateProduct(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-products", businessId] });
    },
  });
}
