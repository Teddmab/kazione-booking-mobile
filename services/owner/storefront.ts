import { api } from "@/lib/api";
import { prepareWebpUri, uriToBlob } from "@/lib/imageUpload";
import type {
  GalleryItem,
  StorefrontPromotion,
  StorefrontRow,
  UpdateStorefrontData,
} from "@/types/owner";

type UploadUrlResponse = { upload_url: string; public_url: string };

async function getSignedUpload(
  businessId: string,
  assetType: "logo" | "cover" | "gallery",
): Promise<UploadUrlResponse> {
  const params = new URLSearchParams({
    business_id: businessId,
    asset_type: assetType,
  });
  return api.post<UploadUrlResponse>(`/storefront-upload?${params}`);
}

async function putImage(uploadUrl: string, uri: string) {
  const webpUri = await prepareWebpUri(uri);
  const blob = await uriToBlob(webpUri);
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": "image/webp" },
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
}

export async function getOwnerStorefront(businessId: string): Promise<StorefrontRow | null> {
  return api.get<StorefrontRow | null>(
    `/storefront-owner?business_id=${encodeURIComponent(businessId)}`,
  );
}

function coerceList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "promotions" in payload) {
    const nested = (payload as { promotions?: unknown }).promotions;
    return Array.isArray(nested) ? (nested as T[]) : [];
  }
  return [];
}

export async function getGalleryImages(businessId: string): Promise<GalleryItem[]> {
  const data = await api.get<GalleryItem[] | unknown>(
    `/storefront-owner?action=gallery&business_id=${encodeURIComponent(businessId)}`,
  );
  return coerceList<GalleryItem>(data);
}

export async function getStorefrontPromotions(businessId: string): Promise<StorefrontPromotion[]> {
  const data = await api.get<StorefrontPromotion[] | unknown>(
    `/storefront-owner?action=promotions&business_id=${encodeURIComponent(businessId)}`,
  );
  return coerceList<StorefrontPromotion>(data);
}

export async function updateStorefront(
  businessId: string,
  updates: UpdateStorefrontData,
): Promise<StorefrontRow> {
  return api.patch<StorefrontRow>("/storefront-owner", {
    business_id: businessId,
    ...updates,
  });
}

export async function uploadCoverImage(businessId: string, localUri: string): Promise<string> {
  const { upload_url, public_url } = await getSignedUpload(businessId, "cover");
  await putImage(upload_url, localUri);
  await updateStorefront(businessId, { cover_image_url: public_url });
  return public_url;
}

export async function uploadGalleryImage(
  storefrontId: string,
  businessId: string,
  localUri: string,
): Promise<GalleryItem> {
  const { upload_url, public_url } = await getSignedUpload(businessId, "gallery");
  await putImage(upload_url, localUri);
  return api.post<GalleryItem>(`/storefront-owner?action=gallery-record&business_id=${encodeURIComponent(businessId)}`, {
    storefront_id: storefrontId,
    image_url: public_url,
  });
}

export async function deleteGalleryImage(galleryId: string, imageUrl: string): Promise<void> {
  await api.delete(
    `/storefront-owner?action=gallery&id=${encodeURIComponent(galleryId)}&image_url=${encodeURIComponent(imageUrl)}`,
  );
}

export async function addPromotion(
  businessId: string,
  promo: { title: string; description?: string; valid_until?: string | null },
): Promise<StorefrontPromotion> {
  return api.post<StorefrontPromotion>(
    `/storefront-owner?action=promotion&business_id=${encodeURIComponent(businessId)}`,
    promo,
  );
}

export async function removePromotion(businessId: string, promoId: string): Promise<void> {
  await api.delete(
    `/storefront-owner?action=promotion&id=${encodeURIComponent(promoId)}&business_id=${encodeURIComponent(businessId)}`,
  );
}

export async function setStorefrontPublished(businessId: string, publish: boolean): Promise<void> {
  await api.post(
    `/storefront-owner?action=${publish ? "publish" : "unpublish"}&business_id=${encodeURIComponent(businessId)}`,
  );
}
