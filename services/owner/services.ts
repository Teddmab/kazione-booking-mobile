import { api } from "@/lib/api";
import type { OwnerServiceRow } from "@/types/owner";

export async function getOwnerServices(businessId: string): Promise<OwnerServiceRow[]> {
  return api.get<OwnerServiceRow[]>(
    `/services?business_id=${encodeURIComponent(businessId)}`,
  );
}
