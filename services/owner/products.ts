import { api } from "@/lib/api";
import type {
  AdjustStockData,
  CreateProductData,
  PaginatedProducts,
  ProductDetail,
  ProductRow,
} from "@/types/products";

export async function getProducts(businessId: string): Promise<PaginatedProducts> {
  const params = new URLSearchParams({ business_id: businessId });
  return api.get<PaginatedProducts>(`/products?${params}`);
}

export async function getProduct(id: string): Promise<ProductDetail> {
  return api.get<ProductDetail>(`/products?id=${encodeURIComponent(id)}`);
}

export async function createProduct(
  businessId: string,
  input: CreateProductData,
): Promise<ProductRow> {
  return api.post<ProductRow>("/products", { ...input, business_id: businessId });
}

export async function adjustStock(
  productId: string,
  businessId: string,
  input: AdjustStockData,
): Promise<ProductRow> {
  return api.patch<ProductRow>(
    `/products?action=adjust&id=${encodeURIComponent(productId)}`,
    { ...input, business_id: businessId },
  );
}

export async function deactivateProduct(id: string): Promise<void> {
  await api.patch(`/products?action=deactivate&id=${encodeURIComponent(id)}`);
}
