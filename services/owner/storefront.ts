import { api } from "@/lib/api";
import type { StorefrontRow } from "@/types/owner";

export async function getOwnerStorefront(businessId: string): Promise<StorefrontRow | null> {
  return api.get<StorefrontRow | null>(
    `/storefront-owner?business_id=${encodeURIComponent(businessId)}`,
  );
}
