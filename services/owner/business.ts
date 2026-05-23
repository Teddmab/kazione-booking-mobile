import { api } from "@/lib/api";
import type { StorefrontRow, UpdateStorefrontData } from "@/types/owner";

export interface CreateBusinessInput {
  business_name: string;
}

export interface CreateBusinessResult {
  business_id: string;
  business_name: string;
  slug: string;
}

export async function createBusiness(input: CreateBusinessInput): Promise<CreateBusinessResult> {
  return api.post<CreateBusinessResult>("/create-business", input);
}

export async function getBusinessStorefront(businessId: string): Promise<StorefrontRow | null> {
  return api.get<StorefrontRow | null>(
    `/storefront-owner?business_id=${encodeURIComponent(businessId)}`,
  );
}

export async function updateBusinessStorefront(
  businessId: string,
  updates: UpdateStorefrontData & { title?: string | null },
): Promise<StorefrontRow> {
  return api.patch<StorefrontRow>("/storefront-owner", {
    business_id: businessId,
    ...updates,
  });
}
