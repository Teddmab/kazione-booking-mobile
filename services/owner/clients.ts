import { api } from "@/lib/api";
import type { ClientFilters, ClientStats, PaginatedClients } from "@/types/owner";

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

export async function getClientStats(businessId: string): Promise<ClientStats> {
  const params = new URLSearchParams({
    business_id: businessId,
    action: "stats",
  });
  return api.get<ClientStats>(`/clients?${params}`);
}
