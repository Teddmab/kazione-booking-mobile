import { api } from "@/lib/api";
import { computeClientKPIs } from "@/lib/clientStatus";
import type {
  ClientDetailRow,
  ClientFilters,
  ClientStats,
  ClientWithStats,
  CreateClientInput,
  PaginatedClients,
  UpdateClientInput,
} from "@/types/owner";

const EMPTY_STATS: ClientStats = {
  total: 0,
  new: 0,
  active: 0,
  vip: 0,
  at_risk: 0,
  inactive: 0,
};

function isClientStats(payload: unknown): payload is ClientStats {
  if (!payload || typeof payload !== "object") return false;
  const row = payload as Record<string, unknown>;
  return typeof row.total === "number" && typeof row.new === "number";
}

function normalizeClientStats(payload: unknown): ClientStats {
  if (isClientStats(payload)) return payload;

  if (payload && typeof payload === "object" && "clients" in payload) {
    const clients = (payload as PaginatedClients).clients;
    if (Array.isArray(clients)) {
      const total = (payload as PaginatedClients).total ?? clients.length;
      return computeClientKPIs(clients as ClientWithStats[], total);
    }
  }

  return EMPTY_STATS;
}

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
  const data = await api.get<unknown>(`/clients?${params}`);
  return normalizeClientStats(data);
}

export async function getClient(clientId: string): Promise<ClientDetailRow> {
  return api.get<ClientDetailRow>(`/clients?id=${encodeURIComponent(clientId)}`);
}

export async function createClient(input: CreateClientInput): Promise<ClientDetailRow> {
  return api.post<ClientDetailRow>("/clients", input);
}

export async function patchClient(
  clientId: string,
  data: UpdateClientInput,
): Promise<ClientDetailRow> {
  return api.patch<ClientDetailRow>(`/clients?id=${encodeURIComponent(clientId)}`, data);
}
