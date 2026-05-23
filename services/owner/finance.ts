import { api } from "@/lib/api";
import { getAppointments } from "@/services/owner/appointments";
import type { AppointmentStatus, PaginatedAppointments } from "@/types/owner";
import type {
  DateRange,
  IncomePeriod,
  RevenueSummary,
  StaffPerformanceRow,
  TransactionFilters,
  TransactionStatusFilter,
} from "@/types/finance";

export async function getRevenueSummary(
  businessId: string,
  dateRange: DateRange,
): Promise<RevenueSummary> {
  const params = new URLSearchParams({
    action: "revenue",
    business_id: businessId,
    from: dateRange.from,
    to: dateRange.to,
  });
  return api.get<RevenueSummary>(`/finance?${params}`);
}

export async function getIncomeBreakdown(
  businessId: string,
  dateRange: DateRange,
  groupBy: "day" | "week" | "month" = "day",
): Promise<IncomePeriod[]> {
  const params = new URLSearchParams({
    action: "income",
    business_id: businessId,
    from: dateRange.from,
    to: dateRange.to,
    group_by: groupBy,
  });
  return api.get<IncomePeriod[]>(`/finance?${params}`);
}

export async function getStaffPerformance(
  businessId: string,
  dateRange: DateRange,
): Promise<StaffPerformanceRow[]> {
  const params = new URLSearchParams({
    action: "staff-performance",
    business_id: businessId,
    from: dateRange.from,
    to: dateRange.to,
  });
  return api.get<StaffPerformanceRow[]>(`/finance?${params}`);
}

function mapStatusFilter(filter: TransactionStatusFilter): AppointmentStatus[] | undefined {
  if (filter === "all" || filter === "refunded") return undefined;
  if (filter === "completed") return ["completed"];
  if (filter === "cancelled") return ["cancelled"];
  return undefined;
}

export async function getTransactions(
  businessId: string,
  filters: TransactionFilters = {},
): Promise<PaginatedAppointments> {
  const { status = "all", dateFrom, dateTo, page = 1, limit = 20 } = filters;

  const result = await getAppointments(businessId, {
    dateFrom,
    dateTo,
    status: mapStatusFilter(status),
    page,
    limit,
  });

  if (status !== "refunded") {
    return result;
  }

  const appointments = result.appointments.filter(
    (a) => a.payment?.status === "refunded" || a.status === "cancelled",
  );

  return {
    appointments,
    total: appointments.length,
  };
}
