import { api } from "@/lib/api";
import type { StaffMember, StaffWorkingDay } from "@/types/owner";

export interface InviteStaffInput {
  business_id: string;
  email: string;
  display_name: string;
  role: string;
  position?: string | null;
}

export interface UpdateStaffInput {
  display_name?: string;
  position?: string | null;
  role?: string;
  is_active?: boolean;
}

export async function getStaffList(businessId: string): Promise<StaffMember[]> {
  return api.get<StaffMember[]>(`/staff?business_id=${encodeURIComponent(businessId)}`);
}

export async function inviteStaff(input: InviteStaffInput): Promise<{
  invite_sent: boolean;
  email: string;
  staff_profile_id: string;
}> {
  return api.post("/invite-staff", input);
}

export async function updateStaff(id: string, data: UpdateStaffInput): Promise<StaffMember> {
  return api.patch<StaffMember>(`/staff?id=${encodeURIComponent(id)}`, data);
}

export async function updateStaffSchedule(
  staffId: string,
  schedule: StaffWorkingDay[],
): Promise<{ success: boolean; schedule: StaffWorkingDay[] }> {
  return api.put(`/staff?action=schedule&id=${encodeURIComponent(staffId)}`, schedule);
}

export async function getStaffServices(staffId: string): Promise<{ service_ids: string[] }> {
  return api.get(`/staff?action=services&id=${encodeURIComponent(staffId)}`);
}

export async function assignStaffServices(
  staffId: string,
  serviceIds: string[],
): Promise<{ success: boolean; service_ids: string[] }> {
  return api.patch(`/staff?action=assign-services&id=${encodeURIComponent(staffId)}`, {
    service_ids: serviceIds,
  });
}

export async function resendStaffInvite(staffId: string): Promise<{
  invite_sent: boolean;
  email: string;
  email_error?: string | null;
}> {
  return api.patch(`/staff?action=resend-invite&id=${encodeURIComponent(staffId)}`, {});
}

export interface StaffDetailFull {
  id: string;
  display_name: string;
  position: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  commission_rate: number;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  bank_account_iban: string | null;
  bank_account_bank_name: string | null;
  bank_account_holder_name: string | null;
  bank_account_is_entrepreneur: boolean;
  bank_account_ee_accepted_at: string | null;
}

export interface CommissionLedgerRow {
  appointment_id: string;
  starts_at: string;
  client_name: string;
  service_name: string;
  price: number;
  commission_amount: number;
  commission_paid_at: string | null;
  commission_pay_method: string | null;
  commission_amount_paid: number | null;
}

export interface CommissionLedgerResult {
  commissions: CommissionLedgerRow[];
  summary: { total_earned: number; total_paid: number; total_unpaid: number };
}

export async function getStaffDetail(staffId: string, businessId: string): Promise<StaffDetailFull> {
  return api.get<StaffDetailFull>(`/staff?id=${encodeURIComponent(staffId)}&business_id=${encodeURIComponent(businessId)}`);
}

export async function getStaffCommissions(
  staffId: string,
  businessId: string,
  params: { status?: "all" | "unpaid" } = {},
): Promise<CommissionLedgerResult> {
  const qs = new URLSearchParams({
    action: "commissions",
    staff_id: staffId,
    business_id: businessId,
  });
  if (params.status) qs.set("status", params.status);
  return api.get<CommissionLedgerResult>(`/staff?${qs.toString()}`);
}

export async function payCommissions(
  businessId: string,
  appointmentIds: string[],
  payMethod: "cash" | "bank_transfer" | "offset",
): Promise<{ paid_count: number }> {
  return api.patch<{ paid_count: number }>("/staff?action=pay-commissions", {
    business_id: businessId,
    appointment_ids: appointmentIds,
    pay_method: payMethod,
  });
}
