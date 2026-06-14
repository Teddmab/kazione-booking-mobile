import { api } from "@/lib/api";
import type {
  CreateOrderData,
  CreateSupplierData,
  PaginatedSupplierOrders,
  PaginatedSuppliers,
  ScanInvoiceResult,
  SupplierDetail,
  SupplierFilters,
  SupplierOrderFilters,
  SupplierOrderRow,
  SupplierOrderStatus,
  SupplierRow,
} from "@/types/suppliers";

export async function getSuppliers(
  businessId: string,
  filters: SupplierFilters = {},
): Promise<PaginatedSuppliers> {
  const { search, isActive, page = 1, limit = 25 } = filters;
  const params = new URLSearchParams({
    business_id: businessId,
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);
  if (isActive !== undefined) params.set("is_active", String(isActive));

  return api.get<PaginatedSuppliers>(`/suppliers?${params}`);
}

export async function getSupplier(id: string): Promise<SupplierDetail> {
  return api.get<SupplierDetail>(`/suppliers?id=${encodeURIComponent(id)}`);
}

export async function createSupplier(
  businessId: string,
  input: CreateSupplierData,
): Promise<SupplierRow> {
  return api.post<SupplierRow>("/suppliers", { ...input, business_id: businessId });
}

export async function updateSupplier(
  id: string,
  input: Partial<CreateSupplierData> & { is_active?: boolean },
): Promise<SupplierRow> {
  return api.patch<SupplierRow>(`/suppliers?id=${encodeURIComponent(id)}`, input);
}

export async function deactivateSupplier(id: string): Promise<void> {
  await api.patch(`/suppliers?action=deactivate&id=${encodeURIComponent(id)}`);
}

export async function getSupplierOrders(
  businessId: string,
  filters: SupplierOrderFilters = {},
): Promise<PaginatedSupplierOrders> {
  const { supplierId, status, page = 1, limit = 25 } = filters;
  const params = new URLSearchParams({
    action: "orders",
    business_id: businessId,
    page: String(page),
    limit: String(limit),
  });
  if (supplierId) params.set("supplier_id", supplierId);
  if (status?.length) status.forEach((s) => params.append("status", s));

  return api.get<PaginatedSupplierOrders>(`/suppliers?${params}`);
}

export async function createSupplierOrder(
  businessId: string,
  input: CreateOrderData,
): Promise<SupplierOrderRow> {
  return api.post<SupplierOrderRow>("/suppliers?action=order", {
    business_id: businessId,
    ...input,
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: SupplierOrderStatus,
): Promise<SupplierOrderRow> {
  return api.patch<SupplierOrderRow>(
    `/suppliers?action=order-status&id=${encodeURIComponent(orderId)}`,
    { status },
  );
}

export async function scanInvoice(
  businessId: string,
  imageUrl?: string,
  imageBase64?: string,
  mediaType?: string,
): Promise<ScanInvoiceResult> {
  return api.post<ScanInvoiceResult>("/scan-invoice", {
    business_id: businessId,
    ...(imageUrl ? { image_url: imageUrl } : {}),
    ...(imageBase64 ? { image_base64: imageBase64, media_type: mediaType ?? "image/jpeg" } : {}),
  });
}
