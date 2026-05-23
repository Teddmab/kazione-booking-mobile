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
  PaginatedExpenses,
  ExpenseRow,
  CreateExpenseData,
  ExpenseBreakdown,
  SupplierSpendRow,
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

export async function getExpenses(
  businessId: string,
  dateRange: DateRange,
  page = 1,
  limit = 50,
): Promise<PaginatedExpenses> {
  const params = new URLSearchParams({
    action: "expenses",
    business_id: businessId,
    date_from: dateRange.from,
    date_to: dateRange.to,
    page: String(page),
    limit: String(limit),
  });
  return api.get<PaginatedExpenses>(`/finance?${params}`);
}

export async function createExpense(
  businessId: string,
  data: CreateExpenseData,
): Promise<ExpenseRow> {
  return api.post<ExpenseRow>("/finance?action=expense", {
    business_id: businessId,
    ...data,
  });
}

export async function getExpenseBreakdown(
  businessId: string,
  dateRange: DateRange,
): Promise<ExpenseBreakdown[]> {
  const params = new URLSearchParams({
    action: "expense-breakdown",
    business_id: businessId,
    from: dateRange.from,
    to: dateRange.to,
  });
  return api.get<ExpenseBreakdown[]>(`/finance?${params}`);
}

export async function getSupplierSpend(
  businessId: string,
  dateRange: DateRange,
): Promise<SupplierSpendRow[]> {
  const params = new URLSearchParams({
    action: "supplier-spend",
    business_id: businessId,
    from: dateRange.from,
    to: dateRange.to,
  });
  return api.get<SupplierSpendRow[]>(`/finance?${params}`);
}
