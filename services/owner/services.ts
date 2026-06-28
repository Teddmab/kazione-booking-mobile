import { api } from "@/lib/api";
import { prepareWebpUri, uriToBlob } from "@/lib/imageUpload";
import { rewriteStorageUrlForDevice } from "@/lib/storageUrl";
import type { OwnerServiceRow, StaffCommissionType } from "@/types/owner";

export interface CreateServiceInput {
  business_id: string;
  name: string;
  duration_minutes: number;
  buffer_minutes?: number;
  price: number;
  deposit_amount?: number | null;
  description?: string | null;
  category_name?: string | null;
  currency_code?: string;
  is_active?: boolean;
  staff_commission_type?: StaffCommissionType;
  staff_commission_value?: number | null;
  image_url?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
}

export interface UpdateServiceInput {
  name?: string;
  duration_minutes?: number;
  buffer_minutes?: number;
  price?: number;
  deposit_amount?: number | null;
  description?: string | null;
  category_name?: string | null;
  is_active?: boolean;
  image_url?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  staff_commission_type?: StaffCommissionType;
  staff_commission_value?: number | null;
}

export async function uploadServiceImage(businessId: string, localUri: string): Promise<string> {
  const params = new URLSearchParams({
    business_id: businessId,
    asset_type: "gallery",
  });
  const { upload_url, public_url } = await api.post<{ upload_url: string; public_url: string }>(
    `/storefront-upload?${params}`,
  );
  const uploadUrl = rewriteStorageUrlForDevice(upload_url);
  const webpUri = await prepareWebpUri(localUri);
  const blob = await uriToBlob(webpUri);
  let res: Response;
  try {
    res = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": "image/webp" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("resolution") || msg.includes("Network request failed")) {
      throw new Error(
        "Impossible d'envoyer l'image. Vérifiez EXPO_PUBLIC_SUPABASE_URL (.env) et que Supabase storage tourne (`npx supabase start` sans -x storage-api).",
      );
    }
    throw err;
  }
  if (!res.ok) {
    if (res.status === 503) {
      throw new Error(
        "Stockage Supabase indisponible. Relancez `npx supabase start` (avec storage-api) dans kazione-booking-backend.",
      );
    }
    throw new Error(`Upload échoué (HTTP ${res.status})`);
  }
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

function withDeviceStorageUrls(service: OwnerServiceRow): OwnerServiceRow {
  const rewrite = (url?: string | null) =>
    url ? rewriteStorageUrlForDevice(url) : url;
  return {
    ...service,
    image_url: rewrite(service.image_url),
    image_url_2: rewrite(service.image_url_2),
    image_url_3: rewrite(service.image_url_3),
  };
}

export async function getOwnerServices(businessId: string): Promise<OwnerServiceRow[]> {
  const rows = await api.get<OwnerServiceRow[]>(
    `/services?business_id=${encodeURIComponent(businessId)}`,
  );
  return rows.map(withDeviceStorageUrls);
}

export async function createService(input: CreateServiceInput): Promise<OwnerServiceRow> {
  const row = await api.post<OwnerServiceRow>("/services", {
    business_id: input.business_id,
    name: input.name,
    duration_minutes: input.duration_minutes,
    buffer_minutes: input.buffer_minutes ?? 0,
    price: input.price,
    deposit_amount: input.deposit_amount ?? null,
    description: input.description ?? null,
    category_name: input.category_name?.trim() || undefined,
    currency_code: input.currency_code ?? "EUR",
    is_active: input.is_active ?? true,
    is_public: true,
    staff_commission_type: input.staff_commission_type ?? "none",
    staff_commission_value:
      input.staff_commission_type && input.staff_commission_type !== "none"
        ? (input.staff_commission_value ?? null)
        : null,
    image_url: input.image_url ?? null,
    image_url_2: input.image_url_2 ?? null,
    image_url_3: input.image_url_3 ?? null,
  });
  return withDeviceStorageUrls(row);
}

export async function updateService(
  id: string,
  data: UpdateServiceInput,
): Promise<OwnerServiceRow> {
  const row = await api.patch<OwnerServiceRow>(`/services?id=${encodeURIComponent(id)}`, data);
  return withDeviceStorageUrls(row);
}

/** Soft-deactivate via PATCH (backend has no DELETE route). */
export async function deactivateService(id: string): Promise<OwnerServiceRow> {
  return updateService(id, { is_active: false });
}

export async function restoreService(id: string): Promise<OwnerServiceRow> {
  return updateService(id, { is_active: true });
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
