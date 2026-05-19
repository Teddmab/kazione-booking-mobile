import { api } from "@/lib/api";
import type { ClientFilters, PaginatedClients } from "@/types/owner";

export async function getClients(
  businessId: string,
  filters: ClientFilters = {},
): Promise<PaginatedClients> {
  const { search, page = 1, limit = 25 } = filters;
  const params = new URLSearchParams({
    business_id: businessId,
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);
  return api.get<PaginatedClients>(`/clients?${params}`);
}
