import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  adjustStock,
  createProduct,
  getProduct,
  getProducts,
} from "@/services/owner/products";
import type { AdjustStockData, CreateProductData } from "@/types/products";

export function useProducts(businessId: string) {
  return useQuery({
    queryKey: ["owner-products", businessId],
    queryFn: () => getProducts(businessId),
    enabled: !!businessId,
  });
}

export function useProductDetail(productId: string | null) {
  return useQuery({
    queryKey: ["owner-product", productId],
    queryFn: () => getProduct(productId!),
    enabled: !!productId,
  });
}

export function useCreateProduct(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductData) => createProduct(businessId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner-products", businessId] });
    },
  });
}

export function useAdjustStock(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: AdjustStockData }) =>
      adjustStock(productId, businessId, data),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["owner-products", businessId] });
      void queryClient.invalidateQueries({ queryKey: ["owner-product", vars.productId] });
    },
  });
}
