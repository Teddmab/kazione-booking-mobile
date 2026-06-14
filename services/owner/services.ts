import { api } from "@/lib/api";
import { prepareWebpUri, uriToBlob } from "@/lib/imageUpload";
import type { OwnerServiceRow } from "@/types/owner";

export interface CreateServiceInput {
  business_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description?: string | null;
  category_name?: string | null;
  currency_code?: string;
  is_active?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  duration_minutes?: number;
  price?: number;
  description?: string | null;
  category_name?: string | null;
  is_active?: boolean;
  image_url?: string | null;
}

async function uploadServiceImage(businessId: string, localUri: string): Promise<string> {
  const params = new URLSearchParams({
    business_id: businessId,
    asset_type: "gallery",
  });
  const { upload_url, public_url } = await api.post<{ upload_url: string; public_url: string }>(
    `/storefront-upload?${params}`,
  );
  const webpUri = await prepareWebpUri(localUri);
  const blob = await uriToBlob(webpUri);
  const res = await fetch(upload_url, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": "image/webp" },
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return public_url;
}

export async function uploadAndAttachServiceImage(
  businessId: string,
  serviceId: string,
  localUri: string,
): Promise<OwnerServiceRow> {
  const imageUrl = await uploadServiceImage(businessId, localUri);
  return updateService(serviceId, { image_url: imageUrl });
}

export async function getOwnerServices(businessId: string): Promise<OwnerServiceRow[]> {
  return api.get<OwnerServiceRow[]>(
    `/services?business_id=${encodeURIComponent(businessId)}`,
  );
}

export async function createService(input: CreateServiceInput): Promise<OwnerServiceRow> {
  return api.post<OwnerServiceRow>("/services", {
    business_id: input.business_id,
    name: input.name,
    duration_minutes: input.duration_minutes,
    price: input.price,
    description: input.description ?? null,
    category_name: input.category_name?.trim() || undefined,
    currency_code: input.currency_code ?? "EUR",
    is_active: input.is_active ?? true,
    is_public: true,
  });
}

export async function updateService(
  id: string,
  data: UpdateServiceInput,
): Promise<OwnerServiceRow> {
  return api.patch<OwnerServiceRow>(`/services?id=${encodeURIComponent(id)}`, data);
}

/** Soft-deactivate via PATCH (backend has no DELETE route). */
export async function deactivateService(id: string): Promise<OwnerServiceRow> {
  return updateService(id, { is_active: false });
}

// ---------------------------------------------------------------------------
// Service → product usage
// ---------------------------------------------------------------------------

export interface ServiceProductUsageRow {
  id: string;
  service_id: string;
  product_id: string;
  quantity_per_service: number;
  product: { id: string; name: string; sku: string | null; unit: string; unit_cost: number | null; current_stock: number };
}

export async function getServiceProductUsage(serviceId: string): Promise<ServiceProductUsageRow[]> {
  const res = await api.get<{ items: ServiceProductUsageRow[] }>(
    `/products?action=service-usage&service_id=${encodeURIComponent(serviceId)}`,
  );
  return res.items;
}

export async function addServiceProduct(
  businessId: string,
  serviceId: string,
  productId: string,
  quantityPerService: number,
): Promise<ServiceProductUsageRow> {
  return api.post<ServiceProductUsageRow>("/products?action=service-usage", {
    business_id: businessId,
    service_id: serviceId,
    product_id: productId,
    quantity_per_service: quantityPerService,
  });
}

export async function removeServiceProduct(usageId: string): Promise<void> {
  await api.delete(`/products?action=service-usage&id=${encodeURIComponent(usageId)}`);
}
