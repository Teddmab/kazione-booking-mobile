import { api } from "@/lib/api";
import type {
  AppointmentFilters,
  AppointmentStatus,
  AppointmentWithRelations,
  DashboardKPIs,
  PaginatedAppointments,
} from "@/types/owner";

export async function getDashboardKPIs(businessId: string): Promise<DashboardKPIs> {
  return api.get<DashboardKPIs>(
    `/appointments?action=kpis&business_id=${encodeURIComponent(businessId)}`,
  );
}

export async function getAppointments(
  businessId: string,
  filters: AppointmentFilters = {},
): Promise<PaginatedAppointments> {
  const { dateFrom, dateTo, status, staffId, search, page = 1, limit = 25 } = filters;
  const params = new URLSearchParams({
    business_id: businessId,
    page: String(page),
    limit: String(limit),
  });
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  if (status?.length) status.forEach((s) => params.append("status", s));
  if (staffId) params.set("staff_id", staffId);
  if (search) params.set("search", search);
  return api.get<PaginatedAppointments>(`/appointments?${params}`);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  reason?: string,
): Promise<AppointmentWithRelations> {
  return api.patch<AppointmentWithRelations>(`/appointments?id=${encodeURIComponent(id)}`, {
    status,
    reason,
  });
}
