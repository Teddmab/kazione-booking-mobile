import { api } from "@/lib/api";
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
