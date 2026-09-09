import { api } from "@/lib/api";

export interface StaffWorkingDay {
  day: number; // 0=Sun … 6=Sat
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
}

export type StaffScheduleDay = StaffWorkingDay;

export interface StaffOverride {
  id: string;
  override_date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export interface StaffSelf {
  staff_profile_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  display_name?: string | null;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  position?: string | null;
  working_hours: StaffWorkingDay[];
  commission_rate?: number;
  bank_account_iban?: string | null;
  bank_account_bank_name?: string | null;
  bank_account_holder_name?: string | null;
  bank_account_is_entrepreneur?: boolean;
  bank_account_ee_accepted_at?: string | null;
}

export interface UpdateBankAccountInput {
  business_id?: string;
  iban?: string;
  bank_name?: string;
  holder_name?: string;
  is_entrepreneur?: boolean;
  ee_accepted?: boolean;
}

export interface CommissionLedgerRow {
  appointment_id: string;
  starts_at: string;
  client_name: string;
  service_name: string;
  price: number;
  commission_type: "percentage" | "fixed" | "none";
  commission_value: number;
  commission_amount: number;
  commission_paid_at: string | null;
  commission_pay_method: string | null;
  commission_amount_paid: number | null;
}

export interface CommissionSummary {
  total_earned: number;
  total_paid: number;
  total_unpaid: number;
}

export interface CommissionLedgerResult {
  commissions: CommissionLedgerRow[];
  summary: CommissionSummary;
}

/** Current staff profile + working hours via GET /staff?action=self */
export async function fetchStaffSelf(businessId: string): Promise<StaffSelf> {
  return api.get<StaffSelf>(
    `/staff?action=self&business_id=${encodeURIComponent(businessId)}`,
  );
}

export async function updateSelfProfile(fields: {
  display_name?: string;
}): Promise<StaffSelf> {
  return api.patch<StaffSelf>("/staff?action=update-self", fields);
}

export async function updateSelfSchedule(
  schedule: StaffScheduleDay[],
): Promise<{ success: boolean; schedule: StaffScheduleDay[] }> {
  return api.put<{ success: boolean; schedule: StaffScheduleDay[] }>(
    "/staff?action=self-schedule",
    schedule,
  );
}

export async function getSelfOverrides(
  from?: string,
  to?: string,
): Promise<StaffOverride[]> {
  const qs = new URLSearchParams({ action: "self-overrides" });
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const data = await api.get<StaffOverride[] | { overrides: StaffOverride[] }>(
    `/staff?${qs.toString()}`,
  );
  return Array.isArray(data) ? data : (data.overrides ?? []);
}

export async function upsertSelfOverride(
  override: Omit<StaffOverride, "id">,
): Promise<StaffOverride> {
  return api.post<StaffOverride>("/staff?action=self-override", override);
}

export async function deleteSelfOverride(date: string): Promise<void> {
  await api.delete(
    `/staff?action=self-override&date=${encodeURIComponent(date)}`,
  );
}

export interface StaffPerformance {
  staff_profile_id: string;
  display_name: string;
  bookings: number;
  revenue: number;
  commission_amount: number;
  unique_clients: number;
  /** Fraction 0–1 from the API */
  completion_rate: number;
  avg_rating: number;
  referrals_initiated: number;
  referral_conversions: number;
  referral_revenue: number;
}

export async function updateBankAccount(
  input: UpdateBankAccountInput,
): Promise<{ success: boolean }> {
  return api.patch<{ success: boolean }>("/staff?action=update-bank-account", input);
}

export async function fetchMyCommissions(params: {
  from?: string;
  to?: string;
  status?: "all" | "unpaid";
  business_id?: string;
}): Promise<CommissionLedgerResult> {
  const qs = new URLSearchParams({ action: "my-commissions" });
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.status) qs.set("status", params.status);
  if (params.business_id) qs.set("business_id", params.business_id);
  return api.get<CommissionLedgerResult>(`/staff?${qs.toString()}`);
}

export async function fetchMyPerformance(
  businessId: string,
  from: string,
  to: string,
): Promise<StaffPerformance | null> {
  const data = await api.get<{ performance: StaffPerformance | null }>(
    `/staff?action=my-performance&business_id=${encodeURIComponent(businessId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  return data.performance;
}
