export interface DateRange {
  from: string;
  to: string;
}

export interface ServiceRevenue {
  service_id: string;
  service_name: string;
  total: number;
  count: number;
}

export interface StaffRevenue {
  staff_profile_id: string;
  display_name: string;
  total: number;
  count: number;
}

export interface RevenueSummary {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  income_by_service: ServiceRevenue[];
  income_by_staff: StaffRevenue[];
  income_by_payment_method: { method: string; total: number; count: number }[];
}

export interface IncomePeriod {
  period: string;
  amount: number;
  appointment_count: number;
}

export interface StaffPerformanceRow {
  staff_profile_id: string;
  display_name: string;
  bookings: number;
  revenue: number;
  unique_clients: number;
  avg_rating: number;
  completion_rate: number;
  commission_amount: number;
}

export interface AIInsightItem {
  type: string;
  title: string;
  description: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
}

export interface AIInsightsResponse {
  insights: AIInsightItem[];
  cached?: boolean;
}

export type FinancePeriodKey = "today" | "week" | "month" | "custom";

export type TransactionStatusFilter = "all" | "completed" | "cancelled" | "refunded";

export interface TransactionFilters {
  status?: TransactionStatusFilter;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export type ExpenseCategory =
  | "supplies"
  | "rent"
  | "utilities"
  | "marketing"
  | "equipment"
  | "staff"
  | "other";

export interface ExpenseRow {
  id: string;
  business_id: string;
  supplier_id: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency_code: string;
  date: string;
  supplier: { id: string; name: string } | null;
}

export interface PaginatedExpenses {
  expenses: ExpenseRow[];
  total: number;
}

export interface CreateExpenseData {
  supplier_id?: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency_code?: string;
  date: string;
  notes?: string | null;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  expense_count: number;
}

export interface SupplierSpendRow {
  supplier_id: string;
  supplier_name: string;
  total: number;
  order_count: number;
}

export type ReportPeriodKey = "7d" | "30d" | "90d" | "ytd";

export type FinanceTabKey = "overview" | "income" | "expenses" | "profitability";

export type ReportsTabKey =
  | "bookings"
  | "clients"
  | "staff"
  | "revenue"
  | "services"
  | "transactions";
